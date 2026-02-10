from __future__ import annotations

import argparse
import asyncio
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn
from brace_backend.core.logging import logger
from brace_backend.domain.analytics import AnalyticsDailyMetric
from brace_backend.domain.analytics_report import AnalyticsReport
from brace_backend.services.telegram_notify import send_analytics_report


def _get_metric(session: Session, metric_date: date, key: str) -> float:
    value = session.scalar(
        select(AnalyticsDailyMetric.metric_value).where(
            AnalyticsDailyMetric.metric_date == metric_date,
            AnalyticsDailyMetric.metric_key == key,
        )
    )
    return float(value or 0)


def _sum_metric(session: Session, start_date: date, end_date: date, key: str) -> float:
    value = session.scalar(
        select(func.coalesce(func.sum(AnalyticsDailyMetric.metric_value), 0)).where(
            AnalyticsDailyMetric.metric_date >= start_date,
            AnalyticsDailyMetric.metric_date <= end_date,
            AnalyticsDailyMetric.metric_key == key,
        )
    )
    return float(value or 0)


def _format_percent(value: float) -> str:
    return f"{value * 100:.1f}%"


def _daily_message(session: Session, target_date: date) -> str:
    sessions = _get_metric(session, target_date, "sessions")
    product_views = _get_metric(session, target_date, "product_views")
    add_to_cart = _get_metric(session, target_date, "add_to_cart")
    checkout_start = _get_metric(session, target_date, "checkout_start")
    orders = _get_metric(session, target_date, "order_created")
    revenue = _get_metric(session, target_date, "revenue_minor_units")
    conversion = orders / checkout_start if checkout_start else 0.0
    cart_cr = add_to_cart / product_views if product_views else 0.0

    return "\n".join(
        [
            f"Ежедневный отчет: {target_date.isoformat()}",
            f"Сессии: {int(sessions)}",
            f"Просмотры товаров: {int(product_views)}",
            f"Добавления в корзину: {int(add_to_cart)} (CR { _format_percent(cart_cr) })",
            f"Начат чек‑аут: {int(checkout_start)}",
            f"Заказы: {int(orders)} (CR { _format_percent(conversion) })",
            f"Выручка: {int(revenue)} (minor units)",
        ]
    )


def _weekly_message(session: Session, target_date: date) -> str:
    start_date = target_date - timedelta(days=6)
    sessions = _sum_metric(session, start_date, target_date, "sessions")
    product_views = _sum_metric(session, start_date, target_date, "product_views")
    add_to_cart = _sum_metric(session, start_date, target_date, "add_to_cart")
    checkout_start = _sum_metric(session, start_date, target_date, "checkout_start")
    orders = _sum_metric(session, start_date, target_date, "order_created")
    revenue = _sum_metric(session, start_date, target_date, "revenue_minor_units")
    conversion = orders / checkout_start if checkout_start else 0.0

    return "\n".join(
        [
            f"Еженедельный отчет: {start_date.isoformat()} — {target_date.isoformat()}",
            f"Сессии: {int(sessions)}",
            f"Просмотры товаров: {int(product_views)}",
            f"Добавления в корзину: {int(add_to_cart)}",
            f"Начат чек‑аут: {int(checkout_start)}",
            f"Заказы: {int(orders)} (CR { _format_percent(conversion) })",
            f"Выручка: {int(revenue)} (minor units)",
        ]
    )


async def _send_and_store(report_type: str, report_date: date, message: str, *, dry_run: bool) -> None:
    engine = create_engine(ensure_sync_dsn(settings.database_url), future=True)
    with Session(engine) as session:
        report = AnalyticsReport(
            report_date=report_date,
            report_type=report_type,
            status="pending",
            content=message,
        )
        session.add(report)
        session.commit()
        session.refresh(report)

        if dry_run:
            report.status = "dry_run"
            report.meta = {"dry_run": True}
        else:
            sent = await send_analytics_report(message, report_type=report_type)
            if sent:
                report.status = "sent"
                report.sent_at = datetime.now(tz=timezone.utc)
            else:
                report.status = "failed"
                report.meta = {"error": "telegram_send_failed"}
        session.add(report)
        session.commit()


def run_report(report_type: str, target_date: date, dry_run: bool) -> None:
    engine = create_engine(ensure_sync_dsn(settings.database_url), future=True)
    with Session(engine) as session:
        if report_type == "daily":
            message = _daily_message(session, target_date)
        else:
            message = _weekly_message(session, target_date)
    asyncio.run(_send_and_store(report_type, target_date, message, dry_run=dry_run))
    logger.info("analytics_report_done", report_type=report_type, report_date=str(target_date), dry_run=dry_run)


def _parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def main() -> None:
    parser = argparse.ArgumentParser(description="Analytics reports to Telegram.")
    parser.add_argument("--type", choices=["daily", "weekly"], default="daily")
    parser.add_argument("--date", help="Date in YYYY-MM-DD (UTC). Defaults to yesterday.")
    parser.add_argument("--dry-run", action="store_true", help="Store report without sending Telegram.")
    args = parser.parse_args()

    target_date = _parse_date(args.date) if args.date else (datetime.now(tz=timezone.utc).date() - timedelta(days=1))
    if not settings.analytics_report_enabled:
        logger.info("analytics_report_disabled")
        return
    run_report(args.type, target_date, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
