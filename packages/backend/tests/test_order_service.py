import pytest
from brace_backend.core.exceptions import ValidationError
from brace_backend.schemas.cart import CartItemCreate
from brace_backend.schemas.orders import OrderCreate
from brace_backend.services.cart_service import cart_service
from brace_backend.services.order_service import order_service

pytestmark = pytest.mark.asyncio


async def _prepare_product(session, user_factory, product_factory, product_variant_factory, size="S", stock=10):
    """Utility to persist a user and product with a single variant for order scenarios."""
    user = user_factory()
    product = product_factory()
    variant = product_variant_factory(product=product, size=size, stock=stock)
    product.variants.append(variant)
    session.add_all([user, product])
    await session.flush()
    return user, product, variant


async def test_create_order_consumes_cart(uow, session, user_factory, product_factory, product_variant_factory):
    """Creating an order should empty the cart and keep pagination totals accurate."""
    user, product, variant = await _prepare_product(
        session, user_factory, product_factory, product_variant_factory, size="S"
    )

    await cart_service.add_item(
        uow,
        user_id=user.id,
        payload=CartItemCreate(product_id=product.id, size="S", quantity=2),
    )

    created = await order_service.create_order(uow, user_id=user.id, payload=OrderCreate())
    assert created.total_minor_units == variant.price_minor_units * 2
    assert len(created.items) == 1
    assert created.items[0].unit_price_minor_units == variant.price_minor_units

    orders, total = await order_service.list_orders(uow, user.id, page=1, page_size=10)
    assert len(orders) == 1
    assert total == 1

    cart = await cart_service.get_cart(uow, user.id)
    assert cart.total_minor_units == 0


async def test_create_order_preserves_minor_unit_precision(
    uow, session, user_factory, product_factory, product_variant_factory
):
    """Order totals must remain exact with repeating decimals converted to minor units."""
    user, product, variant = await _prepare_product(
        session, user_factory, product_factory, product_variant_factory, size="S"
    )
    variant.price_minor_units = 3333
    await session.flush()

    await cart_service.add_item(
        uow,
        user_id=user.id,
        payload=CartItemCreate(product_id=product.id, size="S", quantity=3),
    )

    created = await order_service.create_order(uow, user_id=user.id, payload=OrderCreate())
    assert created.total_minor_units == 9999


async def test_create_order_requires_items(uow, user_factory):
    """Users must not be able to checkout without at least one cart item."""
    user = user_factory()
    with pytest.raises(ValidationError):
        await order_service.create_order(uow, user_id=user.id, payload=OrderCreate())


async def test_create_order_persists_metadata(
    uow, session, user_factory, product_factory, product_variant_factory
):
    """Optional fields such as shipping address should round-trip to the DB."""
    user, product, variant = await _prepare_product(
        session, user_factory, product_factory, product_variant_factory, size="M"
    )

    await cart_service.add_item(
        uow,
        user_id=user.id,
        payload=CartItemCreate(product_id=product.id, size="M", quantity=1),
    )

    created = await order_service.create_order(
        uow,
        user_id=user.id,
        payload=OrderCreate(shipping_address="Test street 1", note="Leave at door"),
    )
    assert created.shipping_address == "Test street 1"
    assert created.note == "Leave at door"
    assert created.total_minor_units == variant.price_minor_units


async def test_create_order_deducts_stock(
    uow, session, user_factory, product_factory, product_variant_factory
):
    """Submitting an order should decrement the backing variant stock value."""
    user, product, variant = await _prepare_product(
        session, user_factory, product_factory, product_variant_factory, size="M", stock=3
    )

    await cart_service.add_item(
        uow,
        user_id=user.id,
        payload=CartItemCreate(product_id=product.id, size="M", quantity=2),
    )

    await order_service.create_order(uow, user_id=user.id, payload=OrderCreate())
    await session.refresh(variant)
    assert variant.stock == 1

    with pytest.raises(ValidationError):
        await cart_service.add_item(
            uow,
            user_id=user.id,
            payload=CartItemCreate(product_id=product.id, size="M", quantity=2),
        )
    await session.refresh(variant)
    assert variant.stock == 1


async def test_create_order_fails_when_stock_changed(
    uow, session, user_factory, product_factory, product_variant_factory
):
    """Orders should abort if stock drops between cart creation and checkout."""
    user, product, variant = await _prepare_product(
        session, user_factory, product_factory, product_variant_factory, size="L", stock=5
    )
    user_id = user.id

    await cart_service.add_item(
        uow,
        user_id=user_id,
        payload=CartItemCreate(product_id=product.id, size="L", quantity=4),
    )

    variant.stock = 2  # simulate external purchase
    await session.flush()

    with pytest.raises(ValidationError):
        await order_service.create_order(uow, user_id=user_id, payload=OrderCreate())
    await uow.rollback()

    cart = await cart_service.get_cart(uow, user_id)
    assert cart.total_minor_units > 0


async def test_list_orders_without_pagination_returns_all(
    uow, session, user_factory, product_factory, product_variant_factory
):
    """Providing no page parameters should return the complete order history."""
    user, product, variant = await _prepare_product(
        session, user_factory, product_factory, product_variant_factory, size="S"
    )

    await cart_service.add_item(
        uow,
        user_id=user.id,
        payload=CartItemCreate(product_id=product.id, size="S", quantity=1),
    )
    await order_service.create_order(uow, user_id=user.id, payload=OrderCreate())

    orders, total = await order_service.list_orders(uow, user.id, page=None, page_size=None)
    assert len(orders) == 1
    assert total == 1


async def test_list_orders_handles_pagination(
    uow, session, user_factory, product_factory, product_variant_factory
):
    """Paginated listing should return deterministic slices and totals."""
    user, product, variant = await _prepare_product(
        session, user_factory, product_factory, product_variant_factory, stock=20
    )

    for _ in range(3):
        await cart_service.add_item(
            uow,
            user_id=user.id,
            payload=CartItemCreate(product_id=product.id, size=variant.size, quantity=1),
        )
        await order_service.create_order(uow, user_id=user.id, payload=OrderCreate())

    first_page, total_first = await order_service.list_orders(uow, user.id, page=1, page_size=2)
    second_page, total_second = await order_service.list_orders(uow, user.id, page=2, page_size=2)

    assert len(first_page) == 2
    assert len(second_page) == 1
    assert total_first == 3
    assert total_second == 3
