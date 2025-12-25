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
from brace_backend.services.telegram_notify import notify_manager_order, notify_manager_order_cancel


class OrderService:
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

            price = variant.active_price_minor_units
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
            shipping_address=payload.shipping_address,
            note=payload.note,
            idempotency_key=idempotency_key,
        )

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
            await notify_manager_order(order, user)
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
        if order.status in ("cancelled", "delivered", "refunded"):
            raise ValidationError("Order cannot be cancelled.")
        order.status = "cancelled"
        await uow.commit()
        await uow.session.refresh(order, attribute_names=["items"])
        await audit_service.log(
            uow,
            action="order_cancelled",
            entity_type="order",
            entity_id=str(order.id),
            metadata={"items": len(order.items)},
            actor_user_id=user_id,
        )
        await analytics_service.record_server_event(
            uow,
            name="order_cancelled",
            occurred_at=order.updated_at,
            user_id=user_id,
            properties={
                "order_id": str(order.id),
                "items_count": len(order.items),
            },
        )
        user = await uow.users.get(user_id)
        if user:
            await notify_manager_order_cancel(order, user)
        return self._to_schema(order)

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
                    "hero_media_url": item.product.hero_media_url if item.product else None,
                    "size": item.size,
                    "quantity": item.quantity,
                    "unit_price_minor_units": item.unit_price_minor_units,
                }
                for item in order.items
            ],
        )


order_service = OrderService()

__all__ = ["order_service", "OrderService"]
