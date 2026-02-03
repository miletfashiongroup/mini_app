from __future__ import annotations

import os
import time
import random
from datetime import datetime, timedelta, timezone, time as dtime

from brace_backend.core.logging import logger
from brace_backend.scripts.analytics_cleanup import cleanup as analytics_cleanup
from brace_backend.scripts.analytics_rollup import rollup_for_date

try:
    from brace_backend.scripts.bonus_expire import expire_bonuses
except ImportError:  # optional on older schemas
    expire_bonuses = None

try:
    from brace_backend.scripts.retention_reminders import run_retention
except ImportError:  # optional on older schemas
    run_retention = None


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        logger.warning("scheduler_invalid_env", name=name, value=raw, fallback=default)
        return default


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _jitter_seconds(max_abs: int = 60) -> int:
    return random.randint(-max_abs, max_abs)


def _next_daily_run(now: datetime, hour: int, minute: int) -> datetime:
    target = datetime.combine(now.date(), dtime(hour=hour, minute=minute, tzinfo=timezone.utc))
    if now >= target:
        target = target + timedelta(days=1)
    return target + timedelta(seconds=_jitter_seconds())


def main() -> None:
    retention_interval_minutes = max(1, _int_env("BRACE_RETENTION_INTERVAL_MINUTES", 60))
    rollup_hour = _int_env("BRACE_ANALYTICS_ROLLUP_HOUR_UTC", 2)
    rollup_minute = _int_env("BRACE_ANALYTICS_ROLLUP_MINUTE_UTC", 10)
    cleanup_hour = _int_env("BRACE_ANALYTICS_CLEANUP_HOUR_UTC", 3)
    cleanup_minute = _int_env("BRACE_ANALYTICS_CLEANUP_MINUTE_UTC", 10)
    bonus_expire_hour = _int_env("BRACE_BONUS_EXPIRE_HOUR_UTC", 4)
    bonus_expire_minute = _int_env("BRACE_BONUS_EXPIRE_MINUTE_UTC", 10)
    poll_seconds = max(10, _int_env("BRACE_SCHEDULER_POLL_SECONDS", 30))

    logger.info(
        "scheduler_started",
        retention_interval_minutes=retention_interval_minutes,
        rollup_hour=rollup_hour,
        rollup_minute=rollup_minute,
        cleanup_hour=cleanup_hour,
        cleanup_minute=cleanup_minute,
        bonus_expire_hour=bonus_expire_hour if expire_bonuses else None,
        bonus_expire_minute=bonus_expire_minute if expire_bonuses else None,
        poll_seconds=poll_seconds,
    )

    last_retention_run: datetime | None = None
    next_retention_at: datetime = _utc_now() + timedelta(minutes=retention_interval_minutes, seconds=_jitter_seconds())
    next_rollup_at = _next_daily_run(_utc_now(), rollup_hour, rollup_minute)
    next_cleanup_at = _next_daily_run(_utc_now(), cleanup_hour, cleanup_minute)
    next_bonus_expire_at = (
        _next_daily_run(_utc_now(), bonus_expire_hour, bonus_expire_minute)
        if expire_bonuses
        else None
    )

    def _log_next() -> None:
        logger.info(
            "scheduler_next_runs",
            next_retention_at=next_retention_at.isoformat(),
            next_rollup_at=next_rollup_at.isoformat(),
            next_cleanup_at=next_cleanup_at.isoformat(),
            next_bonus_expire_at=next_bonus_expire_at.isoformat() if next_bonus_expire_at else None,
        )

    _log_next()

    while True:
        now = _utc_now()

        if run_retention and now >= next_retention_at:
            try:
                run_retention()
            except Exception:
                logger.exception("retention_run_failed")
            last_retention_run = now
            next_retention_at = now + timedelta(minutes=retention_interval_minutes, seconds=_jitter_seconds())
            _log_next()

        if now >= next_rollup_at:
            target_date = now.date() - timedelta(days=1)
            try:
                rollup_for_date(target_date)
            except Exception:
                logger.exception("analytics_rollup_failed", target_date=target_date.isoformat())
            next_rollup_at = _next_daily_run(now, rollup_hour, rollup_minute)
            _log_next()

        if now >= next_cleanup_at:
            try:
                analytics_cleanup()
            except Exception:
                logger.exception("analytics_cleanup_failed")
            next_cleanup_at = _next_daily_run(now, cleanup_hour, cleanup_minute)
            _log_next()

        if expire_bonuses and next_bonus_expire_at and now >= next_bonus_expire_at:
            try:
                expire_bonuses()
            except Exception:
                logger.exception("bonus_expire_failed")
            next_bonus_expire_at = _next_daily_run(now, bonus_expire_hour, bonus_expire_minute)
            _log_next()

        sleep_seconds = max(5, poll_seconds + _jitter_seconds(5))
        time.sleep(sleep_seconds)


if __name__ == "__main__":
    main()
