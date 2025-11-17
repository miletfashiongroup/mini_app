from __future__ import annotations

from pathlib import Path
from typing import Final

from alembic import command
from alembic.config import Config
from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn

ROOT_DIR: Final[Path] = Path(__file__).resolve().parents[2]


def _alembic_config() -> Config:
    cfg = Config(str(ROOT_DIR / "alembic.ini"))
    alembic_url = ensure_sync_dsn(settings.database_url)
    cfg.set_main_option("sqlalchemy.url", alembic_url)
    return cfg


def run_migrations() -> None:
    command.upgrade(_alembic_config(), "head")
