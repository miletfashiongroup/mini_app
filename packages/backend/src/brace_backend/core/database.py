from __future__ import annotations

from sqlalchemy.engine import URL, make_url


def _render(url: URL) -> str:
    return url.render_as_string(hide_password=False)


def ensure_async_dsn(dsn: str) -> str:
    """Normalize DSNs so async SQLAlchemy engines always use async drivers."""
    url = make_url(dsn)
    driver = url.drivername

    if driver.endswith("+psycopg_async") or driver.endswith("+asyncpg"):
        return _render(url)

    if driver.endswith("+psycopg"):
        return _render(url.set(drivername=driver.replace("+psycopg", "+psycopg_async")))

    if driver == "postgresql":
        return _render(url.set(drivername="postgresql+psycopg_async"))

    return _render(url)


def ensure_sync_dsn(dsn: str) -> str:
    """Downgrade async DSNs to sync drivers for tooling such as Alembic."""
    url = make_url(dsn)
    driver = url.drivername

    if driver.endswith("+psycopg"):
        return _render(url)

    if driver.endswith("+psycopg_async"):
        return _render(url.set(drivername=driver.replace("+psycopg_async", "+psycopg")))

    if driver.endswith("+asyncpg"):
        return _render(url.set(drivername="postgresql+psycopg"))

    return _render(url)


__all__ = ["ensure_async_dsn", "ensure_sync_dsn"]
