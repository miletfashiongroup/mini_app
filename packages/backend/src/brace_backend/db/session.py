from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_async_dsn


class SessionManager:
    """Centralised AsyncSession factory with strict transaction management."""

    def __init__(self) -> None:
        self._engine = create_async_engine(
            ensure_async_dsn(settings.database_url),
            echo=settings.database_echo,
            future=True,
            pool_pre_ping=True,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
        )
        self._session_factory = async_sessionmaker(
            bind=self._engine,
            autoflush=False,
            expire_on_commit=False,
            class_=AsyncSession,
        )

    @property
    def engine(self):
        return self._engine

    @property
    def session_factory(self) -> async_sessionmaker[AsyncSession]:
        return self._session_factory

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        async with self._session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                if session.in_transaction():
                    await session.rollback()


session_manager = SessionManager()


async def get_session() -> AsyncIterator[AsyncSession]:
    async with session_manager.session() as session:
        yield session
