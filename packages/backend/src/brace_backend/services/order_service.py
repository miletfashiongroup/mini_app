from __future__ import annotations

from uuid import UUID

from brace_backend.core.exceptions import ValidationError
from brace_backend.core.logging import logger
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.order import Order
from brace_backend.domain.product import ProductVariant
from brace_backend.schemas.orders import OrderCreate, OrderRead


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
                locked_variants[key] = variant

            if variant.stock is None or variant.stock < item.quantity:
                raise ValidationError("Insufficient stock for the requested product.")
            variant.stock -= item.quantity

            line_total = item.quantity * item.unit_price_minor_units
            total_amount_minor_units += line_total

        order = await uow.orders.create(
            user_id=user_id, shipping_address=payload.shipping_address, note=payload.note
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
        logger.info(
            "order_created",
            user_id=str(user_id),
            order_id=str(order.id),
            items_count=len(order.items),
            total_minor_units=total_amount_minor_units,
        )
        return self._to_schema(order)

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
                    "size": item.size,
                    "quantity": item.quantity,
                    "unit_price_minor_units": item.unit_price_minor_units,
                }
                for item in order.items
            ],
        )


order_service = OrderService()

__all__ = ["order_service", "OrderService"]
