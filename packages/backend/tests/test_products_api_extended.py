import pytest
from brace_backend.schemas.common import SuccessResponse


@pytest.mark.asyncio
async def test_products_list_and_filter(api_client):
    client, helpers = api_client
    create_product = helpers["create_product"]

    # Create products in different categories
    await create_product(name="Cat A", size="M")
    await create_product(name="Cat B", size="L")

    resp = await client.get("/api/products")
    assert resp.status_code == 200
    payload = SuccessResponse[list].model_validate(resp.json())
    assert payload.data

    resp_filter = await client.get("/api/products", params={"category": "tees"})
    assert resp_filter.status_code == 200


@pytest.mark.asyncio
async def test_product_detail_and_related(api_client):
    client, helpers = api_client
    create_product = helpers["create_product"]

    product, _ = await create_product(name="Hero Product")
    await create_product(name="Related One")
    resp = await client.get(f"/api/products/{product.id}")
    assert resp.status_code == 200
    detail = resp.json()["data"]
    assert detail["id"] == str(product.id)

    resp_related = await client.get(f"/api/products/{product.id}/related")
    assert resp_related.status_code == 200
    assert isinstance(resp_related.json()["data"], list)


@pytest.mark.asyncio
async def test_product_not_found(api_client):
    client, _ = api_client
    resp = await client.get("/api/products/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404
