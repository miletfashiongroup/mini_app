from __future__ import annotations

import hashlib
import hmac
import json
import threading
import time
import re
from json import JSONDecodeError
from typing import Any
from urllib.parse import parse_qsl, unquote_plus

from brace_backend.core.config import settings
from brace_backend.core.exceptions import AccessDeniedError
from brace_backend.core.logging import logger

try:  # pragma: no cover - import guard for optional redis dependency
    from redis import Redis
    from redis.exceptions import RedisError
except Exception:  # pragma: no cover
    Redis = None  # type: ignore[assignment]
    RedisError = Exception  # type: ignore[assignment]


def _log_auth_debug(message: str, **extra: Any) -> None:
    """Emit structured Telegram auth debug logs (emergency mode)."""
    safe_extra = {key: _redact_value(value) for key, value in extra.items() if value is not None}
    logger.bind(auth="telegram", **safe_extra).info(f"TELEGRAM AUTH DEBUG: {message}")


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
TELEGRAM_CLOCK_SKEW_SECONDS = 30
TELEGRAM_SIGNATURE_SALT = b"WebAppData"
EMAIL_PATTERN = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")


def _redact_value(value: Any) -> Any:
    """Best-effort PII redaction for debug logs."""
    if value is None:
        return value
    if isinstance(value, str):
        trimmed = value.strip()
        if EMAIL_PATTERN.fullmatch(trimmed):
            return "<REDACTED_EMAIL>"
        if len(trimmed) > 80:
            return "<REDACTED>"
        if "token" in trimmed.lower() or len(trimmed) >= 32:
            return "<REDACTED_TOKEN>"
        return trimmed
    if isinstance(value, dict):
        return {k: _redact_value(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return type(value)(_redact_value(v) for v in value)
    return value


def parse_init_data(raw: str) -> dict[str, Any]:
    """Decode Telegram init data query string into Python objects.

    The frontend should pass `Telegram.WebApp.initData` as-is, but in practice it can arrive:
    - URL-encoded twice (`%3D`, `%26`, etc.)
    - with a leading `?` or `tgWebAppData=` prefix from location hash.
    We attempt a best-effort single unquote + prefix trim before parsing.
    """

    def _parse(qs: str) -> dict[str, Any]:
        pairs = parse_qsl(qs, strict_parsing=False, keep_blank_values=True)
        data: dict[str, Any] = {}
        for key, value in pairs:
            if key == "user":
                try:
                    data[key] = json.loads(value)
                except JSONDecodeError as exc:
                    raise AccessDeniedError("Telegram user payload cannot be decoded.") from exc
            else:
                data[key] = value
        return data

    normalized = raw.lstrip("?")
    if normalized.startswith("tgWebAppData="):
        normalized = normalized.split("tgWebAppData=", 1)[1]

    data = _parse(normalized)
    # Fallback: if no hash found and the string looks URL-encoded, unquote once and parse again.
    if ("hash" not in data) and ("%3D" in normalized or "%26" in normalized):
        data = _parse(unquote_plus(normalized))
    return data


def build_data_check_string(payload: dict[str, Any]) -> str:
    """Canonical string builder as described in Telegram WebApp docs."""
    segments = []
    for key, value in sorted(payload.items()):
        if isinstance(value, dict | list):
            encoded = json.dumps(value, separators=(",", ":"), ensure_ascii=False)
        else:
            encoded = str(value)
        segments.append(f"{key}={encoded}")
    return "\n".join(segments)


def derive_hmac_key(secret_token: str) -> bytes:
    """Derive the signing key per Telegram spec."""
    if not secret_token:
        raise AccessDeniedError("Telegram bot token is not configured.")
    return hmac.new(
        key=TELEGRAM_SIGNATURE_SALT,
        msg=secret_token.encode(),
        digestmod=hashlib.sha256,
    ).digest()


def build_signature(
    payload: dict[str, Any],
    *,
    secret_token: str,
    check_string: str | None = None,
) -> str:
    """Generate the HTTPS-style HMAC signature used by Telegram."""
    secret_key = derive_hmac_key(secret_token)
    check_string = check_string or build_data_check_string(payload)
    return hmac.new(
        key=secret_key,
        msg=check_string.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()


def validate_payload_schema(payload: dict[str, Any]) -> None:
    """Ensure Telegram payload contains the minimum required structure."""
    user = payload.get("user")
    if not isinstance(user, dict):
        raise AccessDeniedError("Telegram init data user payload is missing.")
    if "id" not in user:
        raise AccessDeniedError("Telegram init data user payload is invalid.")


class NonceReplayProtector:
    """Best-effort replay protection that prefers Redis but falls back to in-memory storage."""

    def __init__(self, *, redis_url: str, ttl: int, require_redis: bool = False):
        self.ttl = ttl
        self._redis_url = redis_url
        self._require_redis = require_redis
        self._lock = threading.Lock()
        self._memory_store: dict[str, float] = {}
        self._redis_client = self._bootstrap_client()

    def _bootstrap_client(self) -> Redis | None:
        if not redis_url_supports_dedupe(self._redis_url):
            if self._require_redis:
                raise RuntimeError("Redis is required for nonce replay protection in production.")
            return None
        if Redis is None:
            if self._require_redis:
                raise RuntimeError("redis package is required for production replay protection.")
            return None
        try:
            return Redis.from_url(self._redis_url, decode_responses=True)
        except Exception as exc:  # pragma: no cover - best-effort logging path
            if self._require_redis:
                raise RuntimeError("Redis replay store unavailable") from exc
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
    require_redis=settings.is_production,
)  # PRINCIPAL-NOTE: Shared nonce tracking defends against replay even under burst traffic.


def verify_init_data(init_data: str) -> TelegramInitData:
    if not init_data:
        raise AccessDeniedError("Missing Telegram init data header.")
    _log_auth_debug(
        "init_data_received",
        raw_length=len(init_data),
        raw_sample=init_data[:200],
    )

    parsed = parse_init_data(init_data)
    provided_hash = parsed.pop("hash", None)
    if not provided_hash:
        _log_auth_debug("hash_missing", keys=list(parsed.keys()))
        raise AccessDeniedError("Init data hash is missing.")
    _log_auth_debug(
        "init_data_parsed",
        keys=list(parsed.keys()),
        has_user="user" in parsed,
        has_nonce=bool(parsed.get("nonce")),
    )

    validate_payload_schema(parsed)

    secret_source = settings.telegram_webapp_secret or settings.telegram_bot_token
    if not secret_source:
        raise AccessDeniedError("Telegram bot token is not configured.")
    check_string = build_data_check_string(parsed)
    _log_auth_debug(
        "signature_inputs_prepared",
        check_string_length=len(check_string),
        bot_token_present=bool(secret_source),
        bot_token_length=len(secret_source) if secret_source else 0,
    )
    expected_hash = build_signature(parsed, secret_token=secret_source, check_string=check_string)
    hashes_match = hmac.compare_digest(expected_hash, provided_hash)
    _log_auth_debug(
        "signature_computed",
        provided_hash=provided_hash,
        expected_hash=expected_hash,
        hashes_match=hashes_match,
    )
    if not hashes_match:
        raise AccessDeniedError("Telegram signature is invalid.")

    try:
        auth_date = int(parsed.get("auth_date", 0))
    except (TypeError, ValueError) as exc:
        _log_auth_debug("timestamp_invalid", value=parsed.get("auth_date"))
        raise AccessDeniedError("Telegram init data timestamp is invalid.") from exc
    now = time.time()
    if auth_date <= 0:
        _log_auth_debug("timestamp_missing_or_zero")
        raise AccessDeniedError("Telegram init data timestamp is invalid.")
    if now - auth_date > TELEGRAM_MAX_AGE_SECONDS:
        _log_auth_debug("timestamp_expired", auth_date=auth_date, now=int(now))
        raise AccessDeniedError("Telegram init data has expired.")
    if auth_date - now > TELEGRAM_CLOCK_SKEW_SECONDS:
        _log_auth_debug("timestamp_in_future", auth_date=auth_date, now=int(now))
        raise AccessDeniedError("Telegram init data timestamp is in the future.")

    nonce = str(parsed.get("nonce") or parsed.get("query_id") or "")
    if not nonce:
        _log_auth_debug(
            "nonce_missing",
            has_nonce=bool(parsed.get("nonce")),
            has_query_id=bool(parsed.get("query_id")),
        )
        raise AccessDeniedError("Telegram init data nonce is required.")
    _replay_protector.ensure_unique(nonce)
    _log_auth_debug("nonce_ok", nonce=nonce)

    return TelegramInitData(parsed)


async def validate_request(init_data_header: str | None) -> TelegramInitData:
    """Verify Telegram init data header or use a controlled emergency bypass."""
    if getattr(settings, "is_production", False) and getattr(
        settings, "telegram_emergency_bypass", False
    ):
        raise AccessDeniedError("Emergency bypass must be disabled in production.")
    if getattr(settings, "telegram_dev_mode_enabled", False):
        mock_payload = {
            "user": settings.telegram_dev_user,
            "auth_date": int(time.time()),
            "nonce": f"dev-{int(time.time())}",
        }
        # PRINCIPAL-NOTE: Dev shortcuts only run when both env + explicit flags allow so prod is safe.
        return TelegramInitData(mock_payload)
    try:
        if not init_data_header:
            raise AccessDeniedError("X-Telegram-Init-Data header is required.")
        return verify_init_data(init_data_header)
    except AccessDeniedError as exc:
        _log_auth_debug(
            "validate_request_failed",
            reason=str(exc),
            has_header=bool(init_data_header),
            emergency_bypass=getattr(settings, "telegram_emergency_bypass", False),
        )
        if getattr(settings, "telegram_emergency_bypass", False):
            now = int(time.time())
            mock_payload = {
                "user": {
                    "id": 999_999_999,
                    "first_name": "Emergency",
                    "username": "emergency_user",
                },
                "auth_date": now,
                "nonce": f"emergency-{now}",
            }
            _log_auth_debug(
                "validate_request_emergency_bypass",
                mock_user_id=mock_payload["user"]["id"],
            )
            return TelegramInitData(mock_payload)
        raise


__all__ = [
    "NonceReplayProtector",
    "TelegramInitData",
    "build_data_check_string",
    "build_signature",
    "parse_init_data",
    "validate_request",
    "verify_init_data",
]
