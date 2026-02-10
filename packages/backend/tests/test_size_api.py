import pytest

pytestmark = pytest.mark.asyncio


async def test_size_calculation_endpoint(api_client):
    client, _ = api_client

    response = await client.post("/api/size/calc", json={"waist": 92, "hip": 98})

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["size"] == "M"
