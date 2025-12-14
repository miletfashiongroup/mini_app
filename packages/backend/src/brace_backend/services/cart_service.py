from __future__ import annotations

from uuid import UUID

from brace_backend.core.exceptions import NotFoundError, ValidationError
from brace_backend.core.logging import logger
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.cart import CartItem
from brace_backend.schemas.cart import CartCollection, CartItemCreate, CartItemRead, CartItemUpdate

MAX_CART_ITEM_QUANTITY = 10


class CartService:
    async def get_cart(self, uow: UnitOfWork, user_id: UUID) -> CartCollection:
        items = await uow.carts.get_for_user(user_id)
        schema_items = [self._to_schema(item) for item in items]
        total = sum(item.quantity * item.unit_price_minor_units for item in items)
        # PRINCIPAL-NOTE: Totals stay in minor units end-to-end to avoid float drift.
        return CartCollection(items=schema_items, total_minor_units=total)

    async def add_item(
        self,
        uow: UnitOfWork,
        *,
        user_id: UUID,
        payload: CartItemCreate,
    ) -> CartItemRead:
        product = await uow.products.get_with_variants(payload.product_id)
        if not product or product.is_deleted:
            raise NotFoundError("Product not found.")

        variant = next((v for v in product.variants if v.size == payload.size), None)
        if not variant or variant.is_deleted:
            raise ValidationError("Variant with requested size is unavailable.")
        if variant.active_price_minor_units is None:
            raise ValidationError("Active price is missing for the requested variant.")

        existing = await uow.carts.find_existing(
            user_id=user_id, product_id=product.id, size=payload.size
        )
        if existing:
            new_quantity = existing.quantity + payload.quantity
            self._validate_quantity(new_quantity)
            self._validate_stock(new_quantity, variant.stock)
            existing.unit_price_minor_units = variant.active_price_minor_units
            existing.quantity = new_quantity
            existing.variant_id = variant.id
            cart_item = existing
        else:
            self._validate_quantity(payload.quantity)
            self._validate_stock(payload.quantity, variant.stock)
            cart_item = CartItem(
                user_id=user_id,
                product_id=product.id,
                variant_id=variant.id,
                size=payload.size,
                quantity=payload.quantity,
                unit_price_minor_units=variant.active_price_minor_units,
            )
            await uow.carts.add(cart_item)
            cart_item.product = product

        await uow.commit()
        await uow.refresh(cart_item)
        logger.info(
            "cart_item_added",
            user_id=str(user_id),
            cart_item_id=str(cart_item.id),
            product_id=str(product.id),
            variant_id=str(variant.id),
            quantity=cart_item.quantity,
        )
        return self._to_schema(cart_item)

    async def update_item(
        self,
        uow: UnitOfWork,
        *,
        user_id: UUID,
        item_id: UUID,
        payload: CartItemUpdate,
    ) -> CartItemRead:
        cart_item = await uow.carts.get_for_user_by_id(user_id=user_id, item_id=item_id)
        if not cart_item:
            raise NotFoundError("Cart item not found.")

        product = await uow.products.get_with_variants(cart_item.product_id)
        if not product or product.is_deleted:
            raise NotFoundError("Product not found.")
        variant = next((v for v in product.variants if v.size == cart_item.size), None)
        if not variant or variant.is_deleted:
            raise ValidationError("Variant with requested size is unavailable.")
        if variant.active_price_minor_units is None:
            raise ValidationError("Active price is missing for the requested variant.")

        self._validate_quantity(payload.quantity)
        self._validate_stock(payload.quantity, variant.stock)
        cart_item.quantity = payload.quantity
        cart_item.variant_id = variant.id
        cart_item.unit_price_minor_units = variant.active_price_minor_units
        await uow.commit()
        await uow.refresh(cart_item)
        logger.info(
            "cart_item_updated",
            user_id=str(user_id),
            cart_item_id=str(item_id),
            quantity=cart_item.quantity,
        )
        return self._to_schema(cart_item)

    async def remove_item(self, uow: UnitOfWork, *, user_id: UUID, item_id: UUID) -> None:
        deleted = await uow.carts.delete_for_user(item_id=item_id, user_id=user_id)
        if not deleted:
            raise NotFoundError("Cart item not found.")
        await uow.commit()
        logger.info("cart_item_removed", user_id=str(user_id), cart_item_id=str(item_id))

    def _to_schema(self, item: CartItem) -> CartItemRead:
        return CartItemRead(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else "",
            size=item.size,
            quantity=item.quantity,
            unit_price_minor_units=item.unit_price_minor_units,
            hero_media_url=item.product.hero_media_url if item.product else None,
            stock_left=item.variant.stock if item.variant else None,
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
