from __future__ import annotations

# ruff: noqa: E402  # env setup must occur before application imports
import asyncio
import os
import sys
import tempfile
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

# Apply test-safe defaults before importing application modules that instantiate settings.
TEST_TMP = Path(__file__).resolve().parents[1] / ".tmp"
TEST_TMP.mkdir(exist_ok=True)
DEFAULT_SQLITE_DSN = f"sqlite+aiosqlite:///{TEST_TMP / 'test.db'}"
os.environ.setdefault("BRACE_REDIS_URL", "memory://")
os.environ.setdefault("BRACE_DISABLE_RATE_LIMIT", "true")
os.environ.setdefault("TEST_DATABASE_URL", DEFAULT_SQLITE_DSN)
os.environ.setdefault("BRACE_DATABASE_URL", os.environ["TEST_DATABASE_URL"])

import pytest
import brace_backend.domain  # noqa: F401  # ensure all models are registered
from brace_backend.api.deps import get_current_init_data, get_current_user, get_uow
from brace_backend.core.database import ensure_async_dsn
from brace_backend.core.security import TelegramInitData
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.base import Base
from brace_backend.domain.user import User
from brace_backend.main import app
from httpx import ASGITransport, AsyncClient
from pytest_factoryboy import register
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from tests.factories import (
    CartItemFactory,
    OrderFactory,
    OrderItemFactory,
    ProductFactory,
    ProductVariantFactory,
    UserFactory,
)

register(UserFactory)
register(ProductFactory)
register(ProductVariantFactory)
register(CartItemFactory)
register(OrderFactory)
register(OrderItemFactory)

if os.name == "posix":
    fallback_tmp = "/tmp"
    windows_tmp = os.environ.get("TMP", "")
    if windows_tmp.startswith("/mnt/") and os.path.isdir(fallback_tmp):
        os.environ["TMP"] = os.environ["TEMP"] = os.environ["TMPDIR"] = fallback_tmp
        tempfile.tempdir = fallback_tmp
elif os.name == "nt":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.append(str(SRC))


DEFAULT_TEST_DB = DEFAULT_SQLITE_DSN
TEST_DATABASE_URL = ensure_async_dsn(os.getenv("TEST_DATABASE_URL", DEFAULT_TEST_DB))
os.environ.setdefault("DATABASE_URL", TEST_DATABASE_URL)


def _engine_kwargs(url: str) -> dict[str, Any]:
    if url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    return {}


def _quoted_tables() -> str:
    qualified = []
    for table in Base.metadata.sorted_tables:
        if table.schema:
            qualified.append(f'"{table.schema}"."{table.name}"')
        else:
            qualified.append(f'"{table.name}"')
    return ", ".join(qualified)


async def _reset_database(engine) -> None:
    """Convenience helper used by fixtures that spin up their own sessions."""
    async with engine.begin() as conn:
        if engine.dialect.name == "sqlite":
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
            return

        table_list = _quoted_tables()
        if not table_list:
            return
        await conn.execute(text(f"TRUNCATE {table_list} RESTART IDENTITY CASCADE"))


@pytest.fixture(scope="session")
def async_engine():
    setup_engine = create_async_engine(
        TEST_DATABASE_URL, future=True, poolclass=NullPool, **_engine_kwargs(TEST_DATABASE_URL)
    )

    async def _prepare_schema(engine):
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(_prepare_schema(setup_engine))
    asyncio.run(setup_engine.dispose())

    engine = create_async_engine(
        TEST_DATABASE_URL, future=True, poolclass=NullPool, **_engine_kwargs(TEST_DATABASE_URL)
    )
    yield engine
    asyncio.run(engine.dispose())


@pytest.fixture
def session_factory(async_engine):
    return async_sessionmaker(bind=async_engine, expire_on_commit=False, class_=AsyncSession)


@pytest.fixture
async def session(session_factory, async_engine) -> AsyncIterator[AsyncSession]:
    await _reset_database(async_engine)
    async with session_factory() as session:
        try:
            yield session
        finally:
            if session.in_transaction():
                await session.rollback()


@pytest.fixture
async def uow(session: AsyncSession) -> UnitOfWork:
    return UnitOfWork(session)


@pytest.fixture
async def api_client(
    session_factory: async_sessionmaker[AsyncSession],
    async_engine,
    user_factory,
    product_factory,
    product_variant_factory,
):
    """HTTP client wired to the async test database via dependency overrides."""

    await _reset_database(async_engine)

    user = user_factory(telegram_id=1111)
    async with session_factory() as session:
        session.add(user)
        await session.commit()
        await session.refresh(user)

    async def override_get_uow() -> AsyncIterator[UnitOfWork]:
        async with session_factory() as session:
            yield UnitOfWork(session)

    async def override_get_current_user() -> User:
        async with session_factory() as session:
            return await session.get(User, user.id)

    async def override_get_current_init_data() -> TelegramInitData:
        return TelegramInitData({"user": {"id": user.telegram_id, "username": user.username}})

    async def create_product(
        *,
        size: str = "M",
        stock: int = 20,
        price_minor_units: int = 3000,
        name: str | None = None,
        description: str | None = None,
    ):
        """Persist a new product with a single variant for HTTP-level tests."""

        overrides = {}
        if name:
            overrides["name"] = name
        if description:
            overrides["description"] = description

        product = product_factory(**overrides)
        variant = product_variant_factory(
            product=product, size=size, stock=stock, price_minor_units=price_minor_units
        )
        product.variants.append(variant)
        async with session_factory() as session:
            session.add(product)
            await session.commit()
        return product, variant

    overrides = {
        get_uow: override_get_uow,
        get_current_user: override_get_current_user,
        get_current_init_data: override_get_current_init_data,
    }
    app.dependency_overrides.update(overrides)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        yield client, {
            "user": user,
            "session_factory": session_factory,
            "create_product": create_product,
            "overrides": overrides,
        }

    app.dependency_overrides.clear()
    await _reset_database(async_engine)
