from __future__ import annotations

import os
from logging.config import fileConfig

from brace_backend import domain  # noqa: F401 - гарантируем регистрацию моделей
from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn
from brace_backend.domain.base import Base
from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine import Connection

from alembic import context

config = context.config

# 1) Берем DSN для Alembic. В Docker он приходит из ALEMBIC_DATABASE_URL.
#    Если переменной нет, используем BRACE_DATABASE_URL, чтобы локально работало.
alembic_url = os.getenv("ALEMBIC_DATABASE_URL", settings.database_url)
config.set_main_option("sqlalchemy.url", ensure_sync_dsn(alembic_url))

# Подключаем логирование (если оно активировано в ini)
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Для offline-режима Alembic генерирует SQL без подключения к БД."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Общий код для online-миграций."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Online-режим: создаем синхронный движок и прогоняем upgrade/downgrade."""
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
