from __future__ import annotations

import hashlib
import hmac
import json
import logging
import threading
import time
from typing import Any
from urllib.parse import parse_qsl

from brace_backend.core.config import settings
from brace_backend.core.exceptions import AccessDeniedError

try:  # pragma: no cover - import guard for optional redis dependency
    from redis import Redis
    from redis.exceptions import RedisError
except Exception:  # pragma: no cover
    Redis = None  # type: ignore[assignment]
    RedisError = Exception  # type: ignore[assignment]

logger = logging.getLogger(__name__)


class TelegramInitData:
    """Thin wrapper exposing structured Telegram WebApp payload fields."""

    def __init__(self, data: dict[str, Any]):
        self.data = data

    @property
    def user(self) -> dict[str, Any]:
        return self.data.get("user", {})

    @property
    def auth_date(self) -> int:
        return int(self.data.get("auth_date", 0))

    @property
    def nonce(self) -> str:
        return str(self.data.get("nonce", ""))


TELEGRAM_MAX_AGE_SECONDS = 60 * 60


def parse_init_data(raw: str) -> dict[str, Any]:
    """Decode Telegram init data query string into Python objects."""
    pairs = parse_qsl(raw, strict_parsing=False)
    data: dict[str, Any] = {}
    for key, value in pairs:
        if key == "user":
            data[key] = json.loads(value)
        else:
            data[key] = value
    return data


def build_data_check_string(payload: dict[str, Any]) -> str:
    """Canonical string builder as described in Telegram WebApp docs."""
    segments = []
    for key, value in sorted(payload.items()):
        if isinstance(value, (dict, list)):
            encoded = json.dumps(value, separators=(",", ":"), ensure_ascii=False)
        else:
            encoded = str(value)
        segments.append(f"{key}={encoded}")
    return "\n".join(segments)


def build_signature(payload: dict[str, Any], *, secret_token: str) -> str:
    """Generate the HTTPS-style HMAC signature used by Telegram."""
    if not secret_token:
        raise AccessDeniedError("Telegram bot token is not configured.")
    secret_key = hashlib.sha256(secret_token.encode()).digest()
    check_string = build_data_check_string(payload)
    return hmac.new(secret_key, msg=check_string.encode(), digestmod=hashlib.sha256).hexdigest()


class NonceReplayProtector:
    """Best-effort replay protection that prefers Redis but falls back to in-memory storage."""

    def __init__(self, *, redis_url: str, ttl: int):
        self.ttl = ttl
        self._redis_url = redis_url
        self._lock = threading.Lock()
        self._memory_store: dict[str, float] = {}
        self._redis_client = self._bootstrap_client()

    def _bootstrap_client(self) -> Redis | None:
        if not redis_url_supports_dedupe(self._redis_url):
            return None
        if Redis is None:
            return None
        try:
            return Redis.from_url(self._redis_url, decode_responses=True)
        except Exception as exc:  # pragma: no cover - best-effort logging path
            logger.warning(
                "Redis replay store unavailable, falling back to in-memory nonce tracking.",
                error=str(exc),
            )
            return None

    def _purge_expired_locked(self, now: float) -> None:
        expired = [nonce for nonce, expiry in self._memory_store.items() if expiry <= now]
        for nonce in expired:
            self._memory_store.pop(nonce, None)

    def _assert_nonce_value(self, nonce: str) -> None:
        if not nonce:
            raise AccessDeniedError("Telegram init data nonce is required.")
        if len(nonce) < 8:
            raise AccessDeniedError("Telegram init data nonce is invalid.")

    def ensure_unique(self, nonce: str) -> None:
        """Guarantee each Telegram payload is processed at most once."""
        self._assert_nonce_value(nonce)
        now = time.time()

        if self._redis_client:
            try:
                inserted = self._redis_client.set(
                    name=f"telegram:init_data:{nonce}",
                    value=str(int(now)),
                    nx=True,
                    ex=self.ttl,
                )
            except RedisError as exc:  # pragma: no cover - depends on redis availability
                logger.warning(
                    "Redis replay store failed; reverting to local nonce tracking.",
                    error=str(exc),
                )
                self._redis_client = None
            else:
                if inserted:
                    return
                raise AccessDeniedError("Telegram init data nonce has already been used.")

        with self._lock:
            self._purge_expired_locked(now)
            if nonce in self._memory_store:
                raise AccessDeniedError("Telegram init data nonce has already been used.")
            self._memory_store[nonce] = now + self.ttl


def redis_url_supports_dedupe(url: str) -> bool:
    return url.startswith(("redis://", "rediss://"))


_replay_protector = NonceReplayProtector(
    redis_url=settings.redis_url,
    ttl=TELEGRAM_MAX_AGE_SECONDS,
)  # PRINCIPAL-NOTE: Shared nonce tracking defends against replay even under burst traffic.


def verify_init_data(init_data: str) -> TelegramInitData:
    if not init_data:
        raise AccessDeniedError("Missing Telegram init data header.")

    parsed = parse_init_data(init_data)
    provided_hash = parsed.pop("hash", None)
    if not provided_hash:
        raise AccessDeniedError("Init data hash is missing.")

    secret_source = settings.telegram_webapp_secret or settings.telegram_bot_token
    expected_hash = build_signature(parsed, secret_token=secret_source)
    if not hmac.compare_digest(expected_hash, provided_hash):
        raise AccessDeniedError("Telegram signature is invalid.")

    auth_date = int(parsed.get("auth_date", 0))
    now = time.time()
    if auth_date <= 0:
        raise AccessDeniedError("Telegram init data timestamp is invalid.")
    if now - auth_date > TELEGRAM_MAX_AGE_SECONDS:
        raise AccessDeniedError("Telegram init data has expired.")
    if auth_date - now > 30:
        raise AccessDeniedError("Telegram init data timestamp is in the future.")

    nonce = str(parsed.get("nonce", ""))
    _replay_protector.ensure_unique(nonce)

    return TelegramInitData(parsed)


async def validate_request(init_data_header: str | None) -> TelegramInitData:
    """Verify Telegram init data header or raise a structured error."""
    if settings.telegram_dev_mode_enabled:
        mock_payload = {
            "user": settings.telegram_dev_user,
            "auth_date": int(time.time()),
            "nonce": f"dev-{int(time.time())}",
        }
        # PRINCIPAL-NOTE: Dev shortcuts only run when both env + explicit flags allow so prod is safe.
        return TelegramInitData(mock_payload)
    if not init_data_header:
        raise AccessDeniedError("X-Telegram-Init-Data header is required.")
    return verify_init_data(init_data_header)


__all__ = [
    "NonceReplayProtector",
    "TelegramInitData",
    "build_data_check_string",
    "build_signature",
    "parse_init_data",
    "validate_request",
    "verify_init_data",
]
