import pytest

pytestmark = pytest.mark.asyncio


async def test_products_list_without_params(api_client):
    """Without explicit parameters pagination should default to the first page."""
    client, ctx = api_client
    for idx in range(3):
        await ctx["create_product"](name=f"Bulk {idx}")

    response = await client.get("/api/products")
    payload = response.json()
    assert response.status_code == 200
    assert payload["error"] is None
    assert len(payload["data"]) == 3
    pagination = payload["pagination"]
    assert pagination["page"] == 1
    assert pagination["pages"] == 1
    assert pagination["total"] == 3


async def test_products_list_with_page_params(api_client):
    """Explicit pagination parameters must cap the result set and compute totals."""
    client, ctx = api_client
    for idx in range(5):
        await ctx["create_product"](name=f"Paged {idx}")

    response = await client.get("/api/products", params={"page": 2, "page_size": 2})
    payload = response.json()
    assert response.status_code == 200
    assert payload["error"] is None
    assert len(payload["data"]) == 2
    pagination = payload["pagination"]
    assert pagination["page"] == 2
    assert pagination["page_size"] == 2
    assert pagination["pages"] == 3
    assert pagination["total"] == 5


async def test_products_invalid_page_size(api_client):
    """API should validate invalid page numbers or sizes."""
    client, _ = api_client
    response = await client.get("/api/products", params={"page": 0})
    assert response.status_code == 422
