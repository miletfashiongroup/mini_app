import pytest
from brace_backend.main import app
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_healthcheck():
    """The health probe should return a consistent success envelope."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/health")
    payload = response.json()
    assert response.status_code == 200
    assert payload["data"]["status"] == "ok"
    assert payload["data"]["database"] == "connected"
    assert payload["error"] is None
