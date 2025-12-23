from __future__ import annotations

import argparse
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn
from brace_backend.domain.analytics import AnalyticsDailyMetric, AnalyticsEvent
from brace_backend.domain.order import Order
from sqlalchemy import create_engine


def _start_end(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)
    end = start + timedelta(days=1)
    return start, end


def _metric(session: Session, metric_date: date, key: str, value: float) -> AnalyticsDailyMetric:
    return AnalyticsDailyMetric(
        metric_date=metric_date,
        metric_key=key,
        metric_value=value,
        computed_at=datetime.now(tz=timezone.utc),
    )


def rollup_for_date(target_date: date) -> None:
    engine = create_engine(ensure_sync_dsn(settings.database_url), future=True)
    start, end = _start_end(target_date)

    with Session(engine) as session:
        session.execute(delete(AnalyticsDailyMetric).where(AnalyticsDailyMetric.metric_date == target_date))

        sessions = session.scalar(
            select(func.count(func.distinct(AnalyticsEvent.session_id))).where(
                AnalyticsEvent.occurred_at >= start,
                AnalyticsEvent.occurred_at < end,
            )
        ) or 0
        users = session.scalar(
            select(func.count(func.distinct(AnalyticsEvent.user_id_hash))).where(
                AnalyticsEvent.occurred_at >= start,
                AnalyticsEvent.occurred_at < end,
                AnalyticsEvent.user_id_hash.is_not(None),
            )
        ) or 0
        product_views = session.scalar(
            select(func.count()).where(
                AnalyticsEvent.name == "product_view",
                AnalyticsEvent.occurred_at >= start,
                AnalyticsEvent.occurred_at < end,
            )
        ) or 0
        add_to_cart = session.scalar(
            select(func.count()).where(
                AnalyticsEvent.name == "add_to_cart",
                AnalyticsEvent.occurred_at >= start,
                AnalyticsEvent.occurred_at < end,
            )
        ) or 0
        checkout_start = session.scalar(
            select(func.count()).where(
                AnalyticsEvent.name == "checkout_start",
                AnalyticsEvent.occurred_at >= start,
                AnalyticsEvent.occurred_at < end,
            )
        ) or 0
        order_created = session.scalar(
            select(func.count()).where(
                Order.created_at >= start,
                Order.created_at < end,
            )
        ) or 0
        revenue = session.scalar(
            select(func.coalesce(func.sum(Order.total_amount_minor_units), 0)).where(
                Order.created_at >= start,
                Order.created_at < end,
            )
        ) or 0
        aov = float(revenue) / float(order_created) if order_created else 0.0

        metrics = [
            _metric(session, target_date, "sessions", float(sessions)),
            _metric(session, target_date, "users", float(users)),
            _metric(session, target_date, "product_views", float(product_views)),
            _metric(session, target_date, "add_to_cart", float(add_to_cart)),
            _metric(session, target_date, "checkout_start", float(checkout_start)),
            _metric(session, target_date, "order_created", float(order_created)),
            _metric(session, target_date, "revenue_minor_units", float(revenue)),
            _metric(session, target_date, "aov_minor_units", float(aov)),
        ]
        session.add_all(metrics)
        session.commit()


def _parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def main() -> None:
    parser = argparse.ArgumentParser(description="Daily analytics rollup for BRACE.")
    parser.add_argument("--date", help="Date in YYYY-MM-DD (UTC). Defaults to yesterday.")
    args = parser.parse_args()

    target_date = _parse_date(args.date) if args.date else (datetime.now(tz=timezone.utc).date() - timedelta(days=1))
    rollup_for_date(target_date)


if __name__ == "__main__":
    main()
