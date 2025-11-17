from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from brace_backend.core.exceptions import NotFoundError, ValidationError
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.cart import CartItem
from brace_backend.schemas.cart import CartCollection, CartItemCreate, CartItemRead

MAX_CART_ITEM_QUANTITY = 10


def _to_money(value: Decimal | float | int) -> float:
    return float(value)


class CartService:
    async def get_cart(self, uow: UnitOfWork, user_id: UUID) -> CartCollection:
        items = await uow.carts.get_for_user(user_id)
        schema_items = [self._to_schema(item) for item in items]
        total = sum(item.quantity * _to_money(item.unit_price) for item in items)
        return CartCollection(items=schema_items, total_amount=round(total, 2))

    async def add_item(
        self,
        uow: UnitOfWork,
        *,
        user_id: UUID,
        payload: CartItemCreate,
    ) -> CartItemRead:
        product = await uow.products.get_with_variants(payload.product_id)
        if not product:
            raise NotFoundError("Product not found.")

        variant = next((v for v in product.variants if v.size == payload.size), None)
        if not variant:
            raise ValidationError("Variant with requested size is unavailable.")

        existing = await uow.carts.find_existing(
            user_id=user_id, product_id=product.id, size=payload.size
        )
        if existing:
            new_quantity = existing.quantity + payload.quantity
            self._validate_quantity(new_quantity)
            self._validate_stock(new_quantity, variant.stock)
            existing.quantity = new_quantity
            cart_item = existing
        else:
            self._validate_quantity(payload.quantity)
            self._validate_stock(payload.quantity, variant.stock)
            cart_item = CartItem(
                user_id=user_id,
                product_id=product.id,
                size=payload.size,
                quantity=payload.quantity,
                unit_price=variant.price,
            )
            await uow.carts.add(cart_item)
            cart_item.product = product

        await uow.commit()
        await uow.refresh(cart_item)
        return self._to_schema(cart_item)

    async def remove_item(self, uow: UnitOfWork, *, user_id: UUID, item_id: UUID) -> None:
        deleted = await uow.carts.delete_for_user(item_id=item_id, user_id=user_id)
        if not deleted:
            raise NotFoundError("Cart item not found.")
        await uow.commit()

    def _to_schema(self, item: CartItem) -> CartItemRead:
        return CartItemRead(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else "",
            size=item.size,
            quantity=item.quantity,
            unit_price=_to_money(item.unit_price),
            hero_media_url=item.product.hero_media_url if item.product else None,
        )

    def _validate_quantity(self, quantity: int) -> None:
        if quantity < 1 or quantity > MAX_CART_ITEM_QUANTITY:
            raise ValidationError(
                f"Quantity must be between 1 and {MAX_CART_ITEM_QUANTITY} per product."
            )

    def _validate_stock(self, requested: int, stock: int | None) -> None:
        if stock is not None and requested > stock:
            raise ValidationError("Requested quantity exceeds available stock.")


cart_service = CartService()

__all__ = ["cart_service", "CartService"]
