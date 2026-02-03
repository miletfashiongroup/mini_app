from __future__ import annotations

import argparse
import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import exists, func, select
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn
from brace_backend.core.logging import logger
from brace_backend.domain.cart import CartItem
from brace_backend.domain.favorite import FavoriteItem
from brace_backend.domain.order import Order
from brace_backend.domain.product import Product
from brace_backend.domain.user import User
from brace_backend.services.telegram_notify import notify_user_message


def _webapp_link() -> str:
    return settings.telegram_webapp_url or ""


def _format_items(items: list[str]) -> str:
    return ", ".join([item for item in items if item]) if items else ""


def _send_message(chat_id: int, text: str) -> bool:
    return asyncio.run(notify_user_message(chat_id, text))


def _send_cart_reminders(session: Session, now: datetime, *, limit: int) -> int:
    cart_cutoff = now - timedelta(hours=settings.retention_cart_delay_hours)
    cooldown_cutoff = now - timedelta(hours=settings.retention_cart_cooldown_hours)
    order_suppression_cutoff = now - timedelta(hours=settings.retention_cart_suppression_hours)
    recent_order_exists = exists(
        select(Order.id).where(
            Order.user_id == User.id,
            Order.created_at >= order_suppression_cutoff,
        )
    )

    stmt = (
        select(User.id, User.telegram_id)
        .join(CartItem, CartItem.user_id == User.id)
        .where(User.consent_given_at.is_not(None))
        .where(User.telegram_id.is_not(None))
        .where(CartItem.created_at <= cart_cutoff)
        .where((User.last_cart_reminder_at.is_(None)) | (User.last_cart_reminder_at <= cooldown_cutoff))
        .where(~recent_order_exists)
        .group_by(User.id, User.telegram_id)
        .order_by(func.min(CartItem.created_at))
        .limit(limit)
    )
    targets = session.execute(stmt).all()
    sent = 0

    for user_id, telegram_id in targets:
        items = session.execute(
            select(Product.name)
            .join(CartItem, CartItem.product_id == Product.id)
            .where(CartItem.user_id == user_id)
            .order_by(CartItem.created_at.desc())
            .limit(3)
        ).scalars().all()
        items_line = _format_items(list(items))
        link = _webapp_link()
        message = (
            f"Вы оставили товары в корзине{':' if items_line else '.'} {items_line}".strip()
            + ("\nОформить заказ: " + link if link else "\nОткройте мини-приложение, чтобы оформить заказ.")
        )
        if _send_message(int(telegram_id), message):
            user = session.get(User, user_id)
            if user:
                user.last_cart_reminder_at = now
                session.commit()
            sent += 1
    return sent


def _send_favorite_reminders(session: Session, now: datetime, *, limit: int) -> int:
    favorite_cutoff = now - timedelta(hours=settings.retention_favorite_delay_hours)
    cooldown_cutoff = now - timedelta(hours=settings.retention_favorite_cooldown_hours)

    stmt = (
        select(User.id, User.telegram_id)
        .join(FavoriteItem, FavoriteItem.user_id == User.id)
        .where(User.consent_given_at.is_not(None))
        .where(User.telegram_id.is_not(None))
        .where(FavoriteItem.created_at <= favorite_cutoff)
        .where((User.last_favorite_reminder_at.is_(None)) | (User.last_favorite_reminder_at <= cooldown_cutoff))
        .group_by(User.id, User.telegram_id)
        .order_by(func.min(FavoriteItem.created_at))
        .limit(limit)
    )
    targets = session.execute(stmt).all()
    sent = 0

    for user_id, telegram_id in targets:
        items = session.execute(
            select(Product.name)
            .join(FavoriteItem, FavoriteItem.product_id == Product.id)
            .where(FavoriteItem.user_id == user_id)
            .order_by(FavoriteItem.created_at.desc())
            .limit(3)
        ).scalars().all()
        items_line = _format_items(list(items))
        link = _webapp_link()
        message = (
            f"В избранном есть вещи{':' if items_line else '.'} {items_line}".strip()
            + ("\nОткрыть избранное: " + link + "/profile/favorites" if link else "\nОткройте мини-приложение, чтобы посмотреть избранное.")
        )
        if _send_message(int(telegram_id), message):
            user = session.get(User, user_id)
            if user:
                user.last_favorite_reminder_at = now
                session.commit()
            sent += 1
    return sent


def _send_repeat_purchase_reminders(session: Session, now: datetime, *, limit: int) -> int:
    repeat_cutoff = now - timedelta(days=settings.retention_repeat_purchase_days)
    cooldown_cutoff = now - timedelta(days=settings.retention_repeat_cooldown_days)
    last_order_subq = (
        select(func.max(Order.created_at))
        .where(Order.user_id == User.id)
        .correlate(User)
        .scalar_subquery()
    )

    stmt = (
        select(User.id, User.telegram_id, last_order_subq.label("last_order_at"))
        .where(User.consent_given_at.is_not(None))
        .where(User.telegram_id.is_not(None))
        .where(last_order_subq.is_not(None))
        .where(last_order_subq <= repeat_cutoff)
        .where(
            (User.last_repeat_purchase_reminder_at.is_(None))
            | (User.last_repeat_purchase_reminder_at <= cooldown_cutoff)
        )
        .order_by(last_order_subq.asc())
        .limit(limit)
    )
    targets = session.execute(stmt).all()
    sent = 0

    for user_id, telegram_id, last_order_at in targets:
        link = _webapp_link()
        last_order_str = last_order_at.date().isoformat() if last_order_at else ""
        message = (
            f"Похоже, вы давно не делали заказ (последний: {last_order_str})."
            + ("\nПовторить заказ: " + link + "/profile/orders" if link else "\nОткройте мини-приложение, чтобы повторить заказ.")
        )
        if _send_message(int(telegram_id), message):
            user = session.get(User, user_id)
            if user:
                user.last_repeat_purchase_reminder_at = now
                session.commit()
            sent += 1
    return sent


def run_retention(*, max_messages: int | None = None) -> None:
    if not settings.retention_enabled:
        logger.info("retention_disabled")
        return
    if not settings.telegram_bot_token:
        logger.warning("retention_skipped", reason="bot_token_missing")
        return

    now = datetime.now(tz=timezone.utc)
    limit = max_messages or settings.retention_max_messages_per_run
    engine = create_engine(ensure_sync_dsn(settings.database_url), future=True)

    with Session(engine) as session:
        sent = 0
        remaining = max(0, limit - sent)
        if remaining:
            sent += _send_cart_reminders(session, now, limit=remaining)
        remaining = max(0, limit - sent)
        if remaining:
            sent += _send_favorite_reminders(session, now, limit=remaining)
        remaining = max(0, limit - sent)
        if remaining:
            sent += _send_repeat_purchase_reminders(session, now, limit=remaining)

    logger.info("retention_complete", sent=sent)


def main() -> None:
    parser = argparse.ArgumentParser(description="Send Telegram retention reminders.")
    parser.add_argument("--max", type=int, help="Max messages per run (overrides config).")
    args = parser.parse_args()
    run_retention(max_messages=args.max)


if __name__ == "__main__":
    main()
