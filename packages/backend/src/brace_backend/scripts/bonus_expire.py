from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import create_engine, exists, func, select
from sqlalchemy.orm import Session, aliased

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn
from brace_backend.core.logging import logger
from brace_backend.domain.bonus import BonusLedger


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def expire_bonuses() -> int:
    now = _utc_now()
    sync_dsn = ensure_sync_dsn(settings.database_url)
    if sync_dsn.startswith("sqlite+aiosqlite"):
        sync_dsn = sync_dsn.replace("sqlite+aiosqlite", "sqlite", 1)
    engine = create_engine(
        sync_dsn,
        future=True,
        isolation_level="READ COMMITTED",
    )
    expired_count = 0

    try:
        with Session(engine) as session:
            used_subq = (
                select(
                    BonusLedger.related_entry_id.label("credit_id"),
                    func.coalesce(func.sum(BonusLedger.amount), 0).label("used_amount"),
                )
                .where(BonusLedger.related_entry_id.is_not(None))
                .where(BonusLedger.entry_type.in_(("debit", "expire", "reversal")))
                .group_by(BonusLedger.related_entry_id)
                .subquery()
            )
            remaining = (BonusLedger.amount - func.coalesce(used_subq.c.used_amount, 0)).label(
                "remaining_amount"
            )
            related = aliased(BonusLedger)
            already_expired = (
                select(related.id)
                .where(related.related_entry_id == BonusLedger.id)
                .where(related.entry_type.in_(("expire", "reversal")))
                .exists()
            )
            stmt = (
                select(BonusLedger, remaining)
                .outerjoin(used_subq, used_subq.c.credit_id == BonusLedger.id)
                .where(BonusLedger.entry_type == "credit")
                .where(BonusLedger.expires_at.is_not(None))
                .where(BonusLedger.expires_at <= now)
                .where(~already_expired)
            )
            rows = session.execute(stmt).all()
            for credit, remaining_amount in rows:
                remaining_value = int(remaining_amount or 0)
                if remaining_value <= 0:
                    continue
                session.add(
                    BonusLedger(
                        user_id=credit.user_id,
                        order_id=credit.order_id,
                        entry_type="expire",
                        amount=remaining_value,
                        reason="expire",
                        related_entry_id=credit.id,
                    )
                )
                expired_count += 1
            session.commit()
    except Exception:
        logger.exception("bonus_expire_failed")
        raise

    logger.info("bonus_expire_complete", expired_entries=expired_count)
    return expired_count


def bonus_expire_job() -> int:
    return expire_bonuses()


__all__ = ["expire_bonuses", "bonus_expire_job"]
