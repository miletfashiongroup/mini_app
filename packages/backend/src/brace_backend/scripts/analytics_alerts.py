from __future__ import annotations

import argparse
from datetime import date, datetime, timedelta, timezone

import asyncio

from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn
from brace_backend.core.logging import logger
from brace_backend.domain.analytics import AnalyticsDailyMetric
from brace_backend.services.telegram_notify import send_analytics_report


def _get_metric(session: Session, metric_date: date, key: str) -> float:
    value = session.scalar(
        select(AnalyticsDailyMetric.metric_value).where(
            AnalyticsDailyMetric.metric_date == metric_date,
            AnalyticsDailyMetric.metric_key == key,
        )
    )
    return float(value or 0)


def _avg_metric(session: Session, start_date: date, end_date: date, key: str) -> float:
    value = session.scalar(
        select(func.avg(AnalyticsDailyMetric.metric_value)).where(
            AnalyticsDailyMetric.metric_date >= start_date,
            AnalyticsDailyMetric.metric_date < end_date,
            AnalyticsDailyMetric.metric_key == key,
        )
    )
    return float(value or 0)


def _format_percent(value: float) -> str:
    return f"{value * 100:.1f}%"


def run_alerts(target_date: date) -> None:
    engine = create_engine(ensure_sync_dsn(settings.database_url), future=True)
    with Session(engine) as session:
        orders = _get_metric(session, target_date, "order_created")
        checkout_start = _get_metric(session, target_date, "checkout_start")
        add_to_cart = _get_metric(session, target_date, "add_to_cart")
        product_views = _get_metric(session, target_date, "product_views")
        sessions = _get_metric(session, target_date, "sessions")
        conversion = orders / checkout_start if checkout_start else 0.0

        avg_start = target_date - timedelta(days=7)
        avg_end = target_date
        avg_orders = _avg_metric(session, avg_start, avg_end, "order_created")
        avg_sessions = _avg_metric(session, avg_start, avg_end, "sessions")
        avg_add_to_cart = _avg_metric(session, avg_start, avg_end, "add_to_cart")
        avg_product_views = _avg_metric(session, avg_start, avg_end, "product_views")
        cart_cr = add_to_cart / product_views if product_views else 0.0
        avg_cart_cr = (avg_add_to_cart / avg_product_views) if avg_product_views else 0.0

        alerts: list[str] = []
        if avg_orders and orders < avg_orders * 0.5:
            alerts.append(
                f"Падение заказов: {int(orders)} vs {avg_orders:.1f} (7д ср.)"
            )

        if checkout_start and conversion < 0.05:
            alerts.append(
                f"Низкая конверсия checkout: {_format_percent(conversion)}"
            )

        if avg_sessions and sessions < avg_sessions * 0.5:
            alerts.append(
                f"Падение сессий: {int(sessions)} vs {avg_sessions:.1f} (7д ср.)"
            )

        if avg_cart_cr and cart_cr < avg_cart_cr * 0.6:
            alerts.append(
                f"Падение CR add_to_cart: {_format_percent(cart_cr)} vs {_format_percent(avg_cart_cr)}"
            )

        if alerts:
            message = "\n".join(
                ["ALERTS аналитики", f"Дата: {target_date.isoformat()}"] + alerts
            )
            logger.warning("analytics_alerts_triggered", alerts=alerts)
            if settings.analytics_report_enabled:
                asyncio.run(send_analytics_report(message, report_type="alerts"))
        else:
            logger.info("analytics_alerts_ok", date=str(target_date))


def _parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def main() -> None:
    parser = argparse.ArgumentParser(description="Analytics alert checks.")
    parser.add_argument("--date", help="Date in YYYY-MM-DD (UTC). Defaults to yesterday.")
    args = parser.parse_args()

    target_date = _parse_date(args.date) if args.date else (datetime.now(tz=timezone.utc).date() - timedelta(days=1))
    run_alerts(target_date)


if __name__ == "__main__":
    main()
