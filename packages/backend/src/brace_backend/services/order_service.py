from __future__ import annotations

import hashlib
from uuid import UUID

from brace_backend.core.exceptions import NotFoundError, ValidationError
from brace_backend.core.logging import logger
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.order import Order
from brace_backend.domain.product import ProductVariant
from brace_backend.services.audit_service import audit_service
from brace_backend.services.analytics_service import analytics_service
from brace_backend.schemas.orders import OrderCreate, OrderRead
from brace_backend.services.referral_service import referral_service
from brace_backend.services.telegram_notify import (
    notify_manager_order,
    notify_manager_order_cancel,
    notify_user_order_status,
)


class OrderService:
    allowed_admin_statuses = {
        "pending",
        "processing",
        "shipped",
        "cancelled",
        "delivered",
        "completed",
    }
    async def list_orders(
        self, uow: UnitOfWork, user_id: UUID, *, page: int | None, page_size: int | None
    ) -> tuple[list[OrderRead], int]:
        orders, total = await uow.orders.list_for_user(
            user_id, page=page, page_size=page_size
        )
        return [self._to_schema(order) for order in orders], total

    async def create_order(
        self,
        uow: UnitOfWork,
        *,
        user_id: UUID,
        payload: OrderCreate,
    ) -> OrderRead:
        cart_items = await uow.carts.get_for_user(user_id)
        if not cart_items:
            raise ValidationError("Cannot create an order with an empty cart.")

        locked_variants: dict[tuple[UUID, str], ProductVariant] = {}
        total_amount_minor_units = 0
        # PRINCIPAL-NOTE: Checkout math never leaves kopeks to guarantee deterministic sums.

        for item in cart_items:
            key = (item.product_id, item.size)
            variant = locked_variants.get(key)
            if variant is None:
                variant = await uow.products.get_variant_for_update(item.product_id, item.size)
                if variant is None:
                    raise ValidationError("Product variant is unavailable.")
                if variant.is_deleted:
                    raise ValidationError("Product variant is unavailable.")
                locked_variants[key] = variant

            if variant.stock is None or variant.stock < item.quantity:
                raise ValidationError("Insufficient stock for the requested product.")
            variant.stock -= item.quantity

            await uow.session.refresh(variant, attribute_names=["prices"])
            price = None
            from datetime import datetime, timezone
            now = datetime.now(tz=timezone.utc)
            for price_obj in sorted(variant.prices, key=lambda item: item.starts_at, reverse=True):
                compare_now = now if price_obj.starts_at.tzinfo else now.replace(tzinfo=None)
                if price_obj.starts_at <= compare_now and (price_obj.ends_at is None or price_obj.ends_at > compare_now):
                    price = price_obj.price_minor_units
                    break
            if price is None and variant.prices:
                price = max(variant.prices, key=lambda item: item.starts_at).price_minor_units
            variant.active_price_minor_units = price
            if price is None:
                raise ValidationError("Active price is missing for the requested variant.")

            item.unit_price_minor_units = price
            line_total = item.quantity * price
            total_amount_minor_units += line_total

        idempotency_key = self._compute_idempotency(cart_items)
        existing_order = await uow.orders.get_by_idempotency(user_id=user_id, idempotency_key=idempotency_key)
        if existing_order:
            await uow.session.refresh(existing_order, attribute_names=["items"])
            return self._to_schema(existing_order)

        order = await uow.orders.create(
            user_id=user_id,
            shipping_address=payload.address or payload.shipping_address,
            note=payload.comment or payload.note,
            idempotency_key=idempotency_key,
        )
        order.meta = {
            "address": payload.address or payload.shipping_address,
            "delivery_type": payload.delivery_type,
            "comment": payload.comment or payload.note,
        }

        for item in cart_items:
            await uow.orders.add_item(
                order,
                product_id=item.product_id,
                size=item.size,
                quantity=item.quantity,
                unit_price_minor_units=item.unit_price_minor_units,
            )
            await uow.session.delete(item)

        order.total_amount_minor_units = total_amount_minor_units
        await uow.commit()
        await uow.session.refresh(order, attribute_names=["items"])
        await audit_service.log(
            uow,
            action="order_created",
            entity_type="order",
            entity_id=str(order.id),
            metadata={"items": len(order.items), "total_minor_units": total_amount_minor_units},
            actor_user_id=user_id,
        )
        for item in order.items:
            await audit_service.log(
                uow,
                action="stock_decrement",
                entity_type="product_variant",
                entity_id=str(item.product_id),
                metadata={"qty": item.quantity, "order_id": str(order.id)},
                actor_user_id=user_id,
            )
        logger.info(
            "order_created",
            user_id=str(user_id),
            order_id=str(order.id),
            items_count=len(order.items),
            total_minor_units=total_amount_minor_units,
        )
        await analytics_service.record_server_event(
            uow,
            name="order_created",
            occurred_at=order.created_at,
            user_id=user_id,
            properties={
                "order_id": str(order.id),
                "order_total_minor_units": total_amount_minor_units,
                "currency": "RUB",
                "items_count": len(order.items),
            },
        )
        user = await uow.users.get(user_id)
        if user:
            await notify_manager_order(uow, order, user)
        return self._to_schema(order)

    async def get_order(self, uow: UnitOfWork, *, user_id: UUID, order_id: UUID) -> OrderRead:
        order = await uow.orders.get_for_user(user_id=user_id, order_id=order_id)
        if not order:
            raise NotFoundError("Order not found.")
        return self._to_schema(order)

    async def cancel_order(self, uow: UnitOfWork, *, user_id: UUID, order_id: UUID) -> OrderRead:
        order = await uow.orders.get_for_user(user_id=user_id, order_id=order_id)
        if not order:
            raise NotFoundError("Order not found.")
        if order.status == "cancelled":
            return self._to_schema(order)
        if order.status in ("delivered", "refunded"):
            raise ValidationError("Order cannot be cancelled.")
        order, _ = await self.set_order_status(
            uow, order_id=order.id, status="cancelled", actor_user_id=user_id
        )
        await audit_service.log(
            uow,
            action="order_cancelled",
            entity_type="order",
            entity_id=str(order.id),
            metadata={"items": len(order.items)},
            actor_user_id=user_id,
        )
        occurred_at = order.updated_at or order.created_at
        await analytics_service.record_server_event(
            uow,
            name="order_cancelled",
            occurred_at=occurred_at,
            user_id=user_id,
            properties={
                "order_id": str(order.id),
                "items_count": len(order.items),
            },
        )
        user = await uow.users.get(user_id)
        if user:
            try:
                await notify_manager_order_cancel(order, user)
            except Exception as exc:
                logger.warning("order_cancel_notify_failed", order_id=str(order.id), error=str(exc))
        return self._to_schema(order)

    async def set_order_status(
        self,
        uow: UnitOfWork,
        *,
        order_id: UUID,
        status: str,
        actor_user_id: UUID | None = None,
    ) -> tuple[Order, bool]:
        order = await uow.orders.get_by_id(order_id=order_id)
        if not order:
            raise NotFoundError("Order not found.")
        if order.status == status:
            return order, False
        order.status = status
        await uow.commit()
        await uow.session.refresh(
            order,
            attribute_names=["items", "updated_at", "status", "last_notified_status"],
        )
        status_messages = {
            "pending": (
                "принят",
                "Менеджер свяжется с вами в течение 4 часов.",
            ),
            "processing": ("в сборке", ""),
            "shipped": ("отправлен", "Детали доставки уточним в чате."),
            "delivered": ("доставлен", "Если есть вопросы — напишите в поддержку."),
            "completed": ("завершён", "Спасибо за покупку!"),
            "cancelled": ("отменён", ""),
        }
        message = status_messages.get(status)
        if message and order.last_notified_status != status:
            user = await uow.users.get(order.user_id)
            if user and user.telegram_id:
                label, hint = message
                sent = False
                try:
                    sent = await notify_user_order_status(
                        telegram_id=int(user.telegram_id),
                        order_id=str(order.id),
                        status=status,
                        label=label,
                        hint=hint,
                    )
                except Exception:
                    logger.exception(
                        "order_status_notify_failed",
                        order_id=str(order.id),
                        status=status,
                    )
                if sent:
                    order.last_notified_status = status
                    await uow.commit()
        _ = actor_user_id
        return order, True

    async def set_status_admin(
        self, uow: UnitOfWork, *, order_id: UUID, status: str, actor_user_id: UUID | None = None
    ) -> OrderRead:
        if status not in self.allowed_admin_statuses:
            raise ValidationError("Invalid order status.")
        order, changed = await self.set_order_status(
            uow, order_id=order_id, status=status, actor_user_id=actor_user_id
        )
        if not changed:
            return self._to_schema(order)
        await audit_service.log(
            uow,
            action="order_status_updated",
            entity_type="order",
            entity_id=str(order.id),
            metadata={"status": status},
            actor_user_id=actor_user_id or order.user_id,
        )
        if status in ("delivered", "completed"):
            await referral_service.on_order_completed(uow, order_id=order.id)
        return self._to_schema(order)

    async def delete_order_admin(self, uow: UnitOfWork, *, order_id: UUID) -> None:
        order = await uow.orders.get_by_id(order_id=order_id)
        if not order:
            raise NotFoundError("Order not found.")
        await uow.orders.delete(order)
        await uow.commit()
        await audit_service.log(
            uow,
            action="order_deleted",
            entity_type="order",
            entity_id=str(order.id),
            metadata={"status": order.status},
            actor_user_id=order.user_id,
        )
        logger.info("order_deleted_admin", order_id=str(order.id))

    def _compute_idempotency(self, cart_items) -> str:
        digest = hashlib.sha256()
        for item in sorted(cart_items, key=lambda x: str(x.variant_id)):
            digest.update(str(item.product_id).encode())
            digest.update(str(item.variant_id).encode())
            digest.update(str(item.quantity).encode())
            digest.update(str(item.unit_price_minor_units).encode())
        return digest.hexdigest()

    def _to_schema(self, order: Order) -> OrderRead:
        return OrderRead(
            id=order.id,
            status=order.status,
            total_minor_units=order.total_amount_minor_units,
            shipping_address=order.shipping_address,
            note=order.note,
            created_at=order.created_at,
            items=[
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": item.product.name if item.product else None,
                    "product_code": item.product.product_code if item.product else None,
                    "hero_media_url": (
                        item.product.hero_media_url
                        if item.product and item.product.hero_media_url
                        else (item.product.gallery[0].url if item.product and item.product.gallery else None)
                    ),
                    "size": item.size,
                    "quantity": item.quantity,
                    "unit_price_minor_units": item.unit_price_minor_units,
                }
                for item in order.items
            ],
        )


order_service = OrderService()

__all__ = ["order_service", "OrderService"]
