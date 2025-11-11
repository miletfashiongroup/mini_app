import hashlib
import hmac
import json
import time
from typing import Any, Dict, Optional
from urllib.parse import parse_qsl

from fastapi import HTTPException, status

from .config import settings


class TelegramInitData:
    def __init__(self, data: Dict[str, Any]):
        self.data = data

    @property
    def user(self) -> Dict[str, Any]:
        return self.data.get("user", {})

    @property
    def auth_date(self) -> int:
        return int(self.data.get("auth_date", 0))


TELEGRAM_MAX_AGE_SECONDS = 60 * 5


def parse_init_data(raw: str) -> Dict[str, Any]:
    pairs = parse_qsl(raw, strict_parsing=False)
    data: Dict[str, Any] = {}
    for key, value in pairs:
        if key == "user":
            data[key] = json.loads(value)
        else:
            data[key] = value
    return data


def verify_init_data(init_data: str) -> TelegramInitData:
    if not init_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing init data")

    parsed = parse_init_data(init_data)
    hash_value = parsed.pop("hash", None)
    if not hash_value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid init data")

    data_check_arr = [f"{k}={json.dumps(v, separators=(',', ':'), ensure_ascii=False) if isinstance(v, (dict, list)) else v}" for k, v in sorted(parsed.items())]
    data_check_string = "\n".join(data_check_arr)

    secret_key = hashlib.sha256(settings.telegram_bot_token.encode()).digest()
    hmac_string = hmac.new(secret_key, msg=data_check_string.encode(), digestmod=hashlib.sha256).hexdigest()

    if not hmac.compare_digest(hmac_string, hash_value):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    auth_date = int(parsed.get("auth_date", 0))
    if abs(time.time() - auth_date) > TELEGRAM_MAX_AGE_SECONDS:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Init data expired")

    return TelegramInitData(parsed)


async def validate_request(init_data_header: Optional[str]) -> TelegramInitData:
    if not init_data_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing init data header")
    return verify_init_data(init_data_header)
