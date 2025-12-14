from __future__ import annotations

from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from brace_backend.core.config import settings


class _FernetWrapper:
    """Small adapter that enforces key presence and handles prefixing."""

    prefix = "enc::"

    def __init__(self, key: str) -> None:
        self._fernet = Fernet(key.encode())

    def encrypt(self, value: str | None) -> str | None:
        if value is None:
            return None
        token = self._fernet.encrypt(value.encode("utf-8"))
        return f"{self.prefix}{token.decode('utf-8')}"

    def decrypt(self, value: str | None) -> str | None:
        if value is None:
            return None
        if not value.startswith(self.prefix):
            # Return plaintext as-is to allow gradual migration.
            return value
        token = value[len(self.prefix) :]
        try:
            plaintext = self._fernet.decrypt(token.encode("utf-8"))
        except InvalidToken:
            # Avoid raising to keep legacy plaintext readable; sanitize upstream logs.
            return None
        return plaintext.decode("utf-8")


@lru_cache(maxsize=1)
def pii_cipher() -> _FernetWrapper:
    key = (settings.pii_encryption_key or "").strip()
    if not key:
        raise RuntimeError(
            "BRACE_PII_ENCRYPTION_KEY is required to encrypt/decrypt PII. "
            "Add it to .env / secrets before starting the app."
        )
    return _FernetWrapper(key)


__all__ = ["pii_cipher"]
