import pytest
from brace_backend.domain.banner import Banner

pytestmark = pytest.mark.asyncio


async def test_get_banners(api_client):
    client, ctx = api_client
    async with ctx["session_factory"]() as session:
        session.add_all(
            [
                Banner(
                    image_url="https://cdn.test/banner-1.jpg",
                    video_url="https://cdn.test/banner-1.mp4",
                    is_active=False,
                    sort_order=2,
                ),
                Banner(
                    image_url="https://cdn.test/banner-2.jpg",
                    video_url="https://cdn.test/banner-2.mp4",
                    is_active=True,
                    sort_order=1,
                ),
            ]
        )
        await session.commit()

    response = await client.get("/api/banners")
    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["active_index"] == 1
    assert len(payload["data"]["banners"]) == 2
    assert payload["data"]["banners"][0]["image_url"].endswith("banner-2.jpg")
