from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn
from brace_backend.core.logging import logger
from brace_backend.domain.analytics import AnalyticsDailyMetric, AnalyticsEvent
from brace_backend.domain.analytics_report import AnalyticsReport


def cleanup() -> None:
    engine = create_engine(ensure_sync_dsn(settings.database_url), future=True)
    now = datetime.now(tz=timezone.utc)
    events_cutoff = now - timedelta(days=settings.analytics_retention_days)
    reports_cutoff = now.date() - timedelta(days=settings.analytics_reports_retention_days)
    rollup_cutoff = now.date() - timedelta(days=settings.analytics_rollup_retention_days)

    with Session(engine) as session:
        deleted_events = session.execute(
            delete(AnalyticsEvent).where(AnalyticsEvent.occurred_at < events_cutoff)
        ).rowcount or 0
        deleted_reports = session.execute(
            delete(AnalyticsReport).where(AnalyticsReport.report_date < reports_cutoff)
        ).rowcount or 0
        deleted_rollups = session.execute(
            delete(AnalyticsDailyMetric).where(AnalyticsDailyMetric.metric_date < rollup_cutoff)
        ).rowcount or 0
        session.commit()

    logger.info(
        "analytics_cleanup_done",
        deleted_events=deleted_events,
        deleted_reports=deleted_reports,
        deleted_rollups=deleted_rollups,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Analytics retention cleanup.")
    parser.parse_args()
    cleanup()


if __name__ == "__main__":
    main()
