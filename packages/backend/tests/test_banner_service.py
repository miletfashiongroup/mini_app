import pytest
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.banner import Banner
from brace_backend.services.banner_service import banner_service


@pytest.mark.asyncio
async def test_banner_service_orders_and_marks_active(session):
    first = Banner(image_url="https://cdn.test/banner-1.jpg", sort_order=2, is_active=False)
    second = Banner(image_url="https://cdn.test/banner-2.jpg", sort_order=1, is_active=True)
    third = Banner(image_url="https://cdn.test/banner-3.jpg", sort_order=3, is_active=False)
    session.add_all([first, second, third])
    await session.commit()
    uow = UnitOfWork(session)

    payload = await banner_service.list_banners(uow)

    assert payload.active_index == 1
    assert [banner.id for banner in payload.banners] == [
        second.id,
        first.id,
        third.id,
    ]
