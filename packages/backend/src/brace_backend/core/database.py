from __future__ import annotations

from sqlalchemy.engine import URL, make_url


def _render(url: URL) -> str:
    return url.render_as_string(hide_password=False)


def ensure_async_dsn(dsn: str) -> str:
    """Normalize DSNs so async SQLAlchemy engines always use async drivers and TLS is enforced."""
    url = make_url(dsn)
    driver = url.drivername

    if driver.endswith("+psycopg_async") or driver.endswith("+asyncpg"):
        normalized = url
    elif driver.endswith("+psycopg"):
        normalized = url.set(drivername=driver.replace("+psycopg", "+psycopg_async"))
    elif driver == "postgresql":
        normalized = url.set(drivername="postgresql+psycopg_async")
    else:
        normalized = url

    query = dict(normalized.query)
    # Enforce TLS for managed Postgres (reg.ru) unless explicitly disabled.
    if normalized.drivername.startswith("postgresql") and "sslmode" not in query:
        query["sslmode"] = "require"
        normalized = normalized.set(query=query)

    return _render(normalized)


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
