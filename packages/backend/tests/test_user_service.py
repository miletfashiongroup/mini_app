from __future__ import annotations

import pytest

from brace_backend.core.exceptions import ValidationError
from brace_backend.core.security import TelegramInitData
from brace_backend.services.user_service import user_service

pytestmark = pytest.mark.asyncio


async def test_sync_from_telegram_creates_user(uow):
    """Telegram init payloads should create a matching user row when missing."""
    payload = {"user": {"id": 123, "first_name": "Alice", "username": "alice"}}
    init_data = TelegramInitData(payload)

    created = await user_service.sync_from_telegram(uow, init_data)

    assert created.telegram_id == 123
    assert created.username == "alice"
    fetched = await uow.users.get_by_telegram_id(123)
    assert fetched is not None


async def test_sync_from_telegram_updates_existing(uow, session, user_factory):
    """Existing users should be patched using the Telegram payload."""
    existing = user_factory(telegram_id=456, username="old-username")
    session.add(existing)
    await session.flush()

    init_data = TelegramInitData({"user": {"id": 456, "username": "new-name"}})
    updated = await user_service.sync_from_telegram(uow, init_data)

    assert updated.username == "new-name"
    reloaded = await uow.users.get_by_telegram_id(456)
    assert reloaded.username == "new-name"


async def test_sync_from_telegram_missing_id_raises(uow):
    """Missing Telegram identifiers should trigger a validation error."""
    init_data = TelegramInitData({"user": {}})
    with pytest.raises(ValidationError):
        await user_service.sync_from_telegram(uow, init_data)
