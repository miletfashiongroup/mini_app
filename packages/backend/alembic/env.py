from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine import Connection, make_url

from brace_backend.core.config import settings
from brace_backend.db.session import Base
from brace_backend import models  # noqa: F401

config = context.config
# Alembic executes migrations synchronously even when the application uses async
# SQLAlchemy sessions. Psycopg's async dialect attempts to spin up an asyncio loop,
# which fails on Windows (ProactorEventLoop is unsupported) and is unnecessary for
# Alembic. Force the sync psycopg driver (+psycopg) while keeping the rest of the URL.
driver_safe_url = make_url(settings.database_url)
if driver_safe_url.drivername.endswith("+psycopg_async"):
    driver_safe_url = driver_safe_url.set(drivername=driver_safe_url.drivername.replace("+psycopg_async", "+psycopg"))
config.set_main_option("sqlalchemy.url", driver_safe_url.render_as_string(hide_password=False))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
