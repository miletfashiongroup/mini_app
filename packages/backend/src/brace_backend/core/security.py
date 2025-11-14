from __future__ import annotations

import hashlib
import hmac
import json
import time
from typing import Any
from urllib.parse import parse_qsl

from brace_backend.core.config import settings
from brace_backend.core.exceptions import AccessDeniedError


class TelegramInitData:
    def __init__(self, data: dict[str, Any]):
        self.data = data

    @property
    def user(self) -> dict[str, Any]:
        return self.data.get("user", {})

    @property
    def auth_date(self) -> int:
        return int(self.data.get("auth_date", 0))


TELEGRAM_MAX_AGE_SECONDS = 60 * 5


def parse_init_data(raw: str) -> dict[str, Any]:
    pairs = parse_qsl(raw, strict_parsing=False)
    data: dict[str, Any] = {}
    for key, value in pairs:
        if key == "user":
            data[key] = json.loads(value)
        else:
            data[key] = value
    return data


def _build_data_check_string(parsed: dict[str, Any]) -> str:
    segments = []
    for key, value in sorted(parsed.items()):
        if isinstance(value, dict | list):
            encoded = json.dumps(value, separators=(",", ":"), ensure_ascii=False)
        else:
            encoded = str(value)
        segments.append(f"{key}={encoded}")
    return "\n".join(segments)


def verify_init_data(init_data: str) -> TelegramInitData:
    if not init_data:
        raise AccessDeniedError("Missing Telegram init data header.")

    parsed = parse_init_data(init_data)
    hash_value = parsed.pop("hash", None)
    if not hash_value:
        raise AccessDeniedError("Init data hash is missing.")

    data_check_string = _build_data_check_string(parsed)

    secret_key = hashlib.sha256(settings.telegram_bot_token.encode()).digest()
    hmac_string = hmac.new(secret_key, msg=data_check_string.encode(), digestmod=hashlib.sha256).hexdigest()

    if not hmac.compare_digest(hmac_string, hash_value):
        raise AccessDeniedError("Telegram signature is invalid.")

    auth_date = int(parsed.get("auth_date", 0))
    if abs(time.time() - auth_date) > TELEGRAM_MAX_AGE_SECONDS:
        raise AccessDeniedError("Telegram init data has expired.")

    return TelegramInitData(parsed)


async def validate_request(init_data_header: str | None) -> TelegramInitData:
    if not init_data_header:
        raise AccessDeniedError("X-Telegram-Init-Data header is required.")
    return verify_init_data(init_data_header)
