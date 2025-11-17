import pytest

from brace_backend.core.exceptions import NotFoundError, ValidationError
from brace_backend.schemas.cart import CartItemCreate
from brace_backend.services.cart_service import cart_service

pytestmark = pytest.mark.asyncio


async def test_add_item_merges_existing(uow, session, user_factory, product_factory, product_variant_factory):
    """Adding the same product twice should merge quantities instead of duplicating rows."""
    user = user_factory()
    product = product_factory()
    variant = product_variant_factory(product=product, size="M")
    product.variants.append(variant)
    session.add_all([user, product])
    await session.flush()

    payload = CartItemCreate(product_id=product.id, size="M", quantity=1)
    await cart_service.add_item(uow, user_id=user.id, payload=payload)
    added = await cart_service.add_item(uow, user_id=user.id, payload=payload)
    cart = await cart_service.get_cart(uow, user.id)

    assert added.quantity == 2
    assert len(cart.items) == 1
    assert cart.items[0].quantity == 2


async def test_get_cart_returns_total(uow, session, user_factory, product_factory, product_variant_factory):
    """Cart summary should report the aggregated total_amount for all entries."""
    user = user_factory()
    product = product_factory()
    variant = product_variant_factory(product=product, size="L")
    product.variants.append(variant)
    session.add_all([user, product])
    await session.flush()

    payload = CartItemCreate(product_id=product.id, size="L", quantity=3)
    await cart_service.add_item(uow, user_id=user.id, payload=payload)

    cart = await cart_service.get_cart(uow, user.id)

    assert cart.total_amount == pytest.approx(variant.price * 3)
    assert cart.items[0].product_name == product.name
    assert cart.items[0].quantity == 3


async def test_remove_item_raises_for_missing(uow, user_factory):
    """Attempting to remove a non-existent item should raise NotFoundError."""
    user = user_factory()
    with pytest.raises(NotFoundError):
        await cart_service.remove_item(uow, user_id=user.id, item_id=user.id)


async def test_add_item_validates_variant(uow, session, user_factory, product_factory):
    """Users cannot add items for sizes that the product does not expose."""
    user = user_factory()
    product = product_factory()
    session.add_all([user, product])
    await session.flush()

    payload = CartItemCreate(product_id=product.id, size="XXL", quantity=1)
    with pytest.raises(ValidationError):
        await cart_service.add_item(uow, user_id=user.id, payload=payload)


async def test_add_item_enforces_quantity_limit(
    uow, session, user_factory, product_factory, product_variant_factory
):
    """The per-item quantity guardrail must fire when exceeding MAX_CART_ITEM_QUANTITY."""
    user = user_factory()
    product = product_factory()
    variant = product_variant_factory(product=product, size="M", stock=20)
    product.variants.append(variant)
    session.add_all([user, product])
    await session.flush()

    await cart_service.add_item(
        uow, user_id=user.id, payload=CartItemCreate(product_id=product.id, size="M", quantity=6)
    )
    with pytest.raises(ValidationError):
        await cart_service.add_item(
            uow,
            user_id=user.id,
            payload=CartItemCreate(product_id=product.id, size="M", quantity=5),
        )


async def test_add_item_enforces_stock(
    uow, session, user_factory, product_factory, product_variant_factory
):
    """Stock checks should apply both on initial add and for subsequent increments."""
    user = user_factory()
    product = product_factory()
    variant = product_variant_factory(product=product, size="S", stock=3)
    product.variants.append(variant)
    session.add_all([user, product])
    await session.flush()

    with pytest.raises(ValidationError):
        await cart_service.add_item(
            uow,
            user_id=user.id,
            payload=CartItemCreate(product_id=product.id, size="S", quantity=4),
        )

    await cart_service.add_item(
        uow,
        user_id=user.id,
        payload=CartItemCreate(product_id=product.id, size="S", quantity=2),
    )
    with pytest.raises(ValidationError):
        await cart_service.add_item(
            uow,
            user_id=user.id,
            payload=CartItemCreate(product_id=product.id, size="S", quantity=2),
        )


async def test_get_cart_empty_returns_zero(uow, user_factory):
    """Users with no cart records should receive a zeroed summary payload."""
    user = user_factory()
    cart = await cart_service.get_cart(uow, user.id)

    assert cart.items == []
    assert cart.total_amount == 0
