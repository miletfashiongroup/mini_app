from __future__ import annotations

import pytest
from brace_backend.api.deps import get_current_init_data, get_current_user
from brace_backend.domain.product import ProductVariant
from brace_backend.main import app
from sqlalchemy import select

pytestmark = pytest.mark.asyncio


def assert_envelope(response, *, status=200):
    """All API responses are wrapped into the same envelope."""
    assert response.status_code == status
    payload = response.json()
    assert "data" in payload
    assert "error" in payload
    return payload


async def _create_sample_products(ctx, count: int) -> None:
    """Bulk helper to seed a deterministic number of catalog items."""
    for idx in range(count):
        await ctx["create_product"](name=f"Product {idx}", price=30 + idx)


async def test_products_list_default(api_client):
    """Default pagination should return the first page with all metadata filled."""
    client, ctx = api_client
    await _create_sample_products(ctx, 2)

    payload = assert_envelope(await client.get("/api/products"))
    assert len(payload["data"]) == 2
    pagination = payload["pagination"]
    assert pagination["page"] == 1
    assert pagination["total"] == 2
    assert pagination["pages"] == 1


async def test_products_list_paginated(api_client):
    """Explicit page/page_size queries must reflect the correct counts."""
    client, ctx = api_client
    await _create_sample_products(ctx, 3)

    payload = assert_envelope(
        await client.get("/api/products", params={"page": 2, "page_size": 2})
    )
    assert len(payload["data"]) == 1
    pagination = payload["pagination"]
    assert pagination["page"] == 2
    assert pagination["page_size"] == 2
    assert pagination["total"] == 3
    assert pagination["pages"] == 2


async def test_products_detail(api_client):
    """Individual product endpoint should return the requested record."""
    client, ctx = api_client
    product, _ = await ctx["create_product"](name="Detailed Product")

    payload = assert_envelope(await client.get(f"/api/products/{product.id}"))
    assert payload["data"]["id"] == str(product.id)
    assert payload["data"]["name"] == "Detailed Product"


async def test_cart_add_remove(api_client):
    """Cart items should accumulate totals and drop back to zero after deletion."""
    client, ctx = api_client
    product, variant = await ctx["create_product"](price=31.0)

    payload = assert_envelope(
        await client.post(
            "/api/cart",
            json={"product_id": str(product.id), "size": variant.size, "quantity": 2},
        ),
        status=201,
    )
    item_id = payload["data"]["id"]
    assert payload["data"]["quantity"] == 2

    cart_payload = assert_envelope(await client.get("/api/cart"))
    assert cart_payload["data"]["total_amount"] == pytest.approx(62.0)
    assert len(cart_payload["data"]["items"]) == 1

    assert_envelope(await client.delete(f"/api/cart/{item_id}"))
    final_payload = assert_envelope(await client.get("/api/cart"))
    assert final_payload["data"]["total_amount"] == 0
    assert final_payload["data"]["items"] == []


async def test_cart_quantity_limit(api_client):
    """The service must reject quantities that exceed the configured per-item limit."""
    client, ctx = api_client
    product, variant = await ctx["create_product"](stock=20)

    assert_envelope(
        await client.post(
            "/api/cart",
            json={"product_id": str(product.id), "size": variant.size, "quantity": 10},
        ),
        status=201,
    )

    response = await client.post(
        "/api/cart",
        json={"product_id": str(product.id), "size": variant.size, "quantity": 1},
    )
    payload = assert_envelope(response, status=422)
    assert payload["error"]["type"] == "validation_error"


async def test_orders_create_and_list(api_client):
    """Creating an order should consume the cart and affect pagination totals."""
    client, ctx = api_client
    product, variant = await ctx["create_product"](price=45.0)

    await client.post(
        "/api/cart",
        json={"product_id": str(product.id), "size": variant.size, "quantity": 2},
    )
    created = assert_envelope(await client.post("/api/orders", json={}), status=201)
    assert created["data"]["total_amount"] == "90.00"

    listed = assert_envelope(await client.get("/api/orders", params={"page": 1, "page_size": 5}))
    assert len(listed["data"]) == 1
    assert listed["pagination"]["total"] == 1
    assert listed["pagination"]["pages"] == 1

    empty_cart = assert_envelope(await client.get("/api/cart"))
    assert empty_cart["data"]["total_amount"] == 0


async def test_orders_empty_cart_error(api_client):
    """Orders endpoint should guard against attempts without items."""
    client, _ = api_client
    response = await client.post("/api/orders", json={})
    payload = assert_envelope(response, status=422)
    assert payload["error"]["type"] == "validation_error"


async def test_orders_overstock_error(api_client):
    """Stock changes between cart and checkout must raise a validation error."""
    client, ctx = api_client
    product, variant = await ctx["create_product"](stock=5)

    await client.post(
        "/api/cart",
        json={"product_id": str(product.id), "size": variant.size, "quantity": 3},
    )
    async with ctx["session_factory"]() as session:
        db_variant = await session.scalar(select(ProductVariant).where(ProductVariant.id == variant.id))
        db_variant.stock = 1
        await session.commit()

    response = await client.post("/api/orders", json={})
    payload = assert_envelope(response, status=422)
    assert payload["error"]["type"] == "validation_error"


async def test_users_me_requires_auth(api_client):
    """Dropping auth dependencies should trigger the access denied handler."""
    client, ctx = api_client
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_current_init_data, None)

    payload = assert_envelope(await client.get("/api/users/me"), status=403)
    assert payload["error"]["type"] == "access_denied"

    app.dependency_overrides.update(ctx["overrides"])
