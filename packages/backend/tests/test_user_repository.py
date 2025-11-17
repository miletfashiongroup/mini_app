from __future__ import annotations

import pytest

from brace_backend.domain.user import User
from brace_backend.repositories.user import UserRepository

pytestmark = pytest.mark.asyncio


async def test_get_by_telegram_id(session, user_factory):
    """Repository should fetch a persisted user by Telegram identifier."""
    user = user_factory(telegram_id=777)
    session.add(user)
    await session.flush()

    repo = UserRepository(session)
    found = await repo.get_by_telegram_id(777)
    assert found is not None
    assert found.id == user.id


async def test_get_by_telegram_id_missing_returns_none(session):
    """Unknown identifiers should return None instead of raising."""
    repo = UserRepository(session)
    assert await repo.get_by_telegram_id(42) is None


async def test_update_from_payload_updates_fields(session, user_factory):
    """Update helper should patch any provided fields without touching others."""
    user = user_factory(telegram_id=888, username="old", first_name="Old")
    session.add(user)
    await session.flush()

    repo = UserRepository(session)
    updated = await repo.update_from_payload(
        user,
        {"username": "new", "first_name": "New", "language_code": "en"},
    )
    assert updated.username == "new"
    assert updated.first_name == "New"
    assert updated.language_code == "en"
