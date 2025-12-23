from __future__ import annotations

import argparse
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn
from brace_backend.core.logging import logger


def _partition_name(year: int, month: int) -> str:
    return f"analytics_events_{year}_{month:02d}"


def ensure_month_partition(target_date: datetime) -> None:
    engine = create_engine(ensure_sync_dsn(settings.database_url), future=True)
    year = target_date.year
    month = target_date.month
    start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    table_name = _partition_name(year, month)

    with Session(engine) as session:
        is_partitioned = session.execute(
            text(
                "SELECT relispartition FROM pg_class WHERE relname = 'analytics_events'"
            )
        ).scalar()
        if is_partitioned:
            logger.warning("analytics_partition_parent_is_partition", table="analytics_events")

        partition_exists = session.execute(
            text(
                "SELECT 1 FROM pg_class WHERE relname = :name"
            ),
            {"name": table_name},
        ).first()
        if partition_exists:
            logger.info("analytics_partition_exists", partition=table_name)
            return

        try:
            session.execute(
                text(
                    f"""
                    CREATE TABLE {table_name}
                    PARTITION OF analytics_events
                    FOR VALUES FROM (:start) TO (:end)
                    """
                ),
                {"start": start, "end": end},
            )
            session.commit()
            logger.info("analytics_partition_created", partition=table_name)
        except Exception as exc:
            session.rollback()
            logger.warning("analytics_partition_failed", error=str(exc))


def main() -> None:
    parser = argparse.ArgumentParser(description="Create monthly partitions for analytics_events.")
    parser.add_argument("--month", help="Target month in YYYY-MM format. Default: текущий месяц.")
    args = parser.parse_args()
    target = datetime.now(tz=timezone.utc)
    if args.month:
        target = datetime.strptime(args.month, "%Y-%m").replace(tzinfo=timezone.utc)
    ensure_month_partition(target)


if __name__ == "__main__":
    main()
