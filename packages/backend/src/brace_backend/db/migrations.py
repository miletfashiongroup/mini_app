from __future__ import annotations

from pathlib import Path
from typing import Final

from alembic import command
from alembic.config import Config
from sqlalchemy.engine import make_url

from brace_backend.core.config import settings

ROOT_DIR: Final[Path] = Path(__file__).resolve().parents[2]


def _alembic_config() -> Config:
    cfg = Config(str(ROOT_DIR / "alembic.ini"))
    alembic_url = settings.database_url
    url_obj = make_url(alembic_url)
    if url_obj.drivername.endswith("+psycopg_async"):
        url_obj = url_obj.set(drivername=url_obj.drivername.replace("+psycopg_async", "+psycopg"))
    elif url_obj.drivername.endswith("+asyncpg"):
        url_obj = url_obj.set(drivername=url_obj.drivername.replace("+asyncpg", "+psycopg"))
    cfg.set_main_option("sqlalchemy.url", url_obj.render_as_string(hide_password=False))
    return cfg


def run_migrations() -> None:
    command.upgrade(_alembic_config(), "head")
