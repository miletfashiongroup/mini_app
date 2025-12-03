import pytest


@pytest.mark.asyncio
async def test_cart_add_patch_delete(api_client):
    client, helpers = api_client
    create_product = helpers["create_product"]
    product, variant = await create_product(stock=2)

    add_resp = await client.post(
        "/api/cart",
        json={"product_id": str(product.id), "size": variant.size, "quantity": 1},
    )
    assert add_resp.status_code == 201
    item_id = add_resp.json()["data"]["id"]

    patch_resp = await client.patch(f"/api/cart/{item_id}", json={"quantity": 2})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["quantity"] == 2

    delete_resp = await client.delete(f"/api/cart/{item_id}")
    assert delete_resp.status_code == 200


@pytest.mark.asyncio
async def test_cart_stock_limit(api_client):
    client, helpers = api_client
    create_product = helpers["create_product"]
    product, variant = await create_product(stock=1)
    resp = await client.post(
        "/api/cart",
        json={"product_id": str(product.id), "size": variant.size, "quantity": 2},
    )
    assert resp.status_code == 422
