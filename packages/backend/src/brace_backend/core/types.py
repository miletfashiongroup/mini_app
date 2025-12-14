from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.types import TypeDecorator

from brace_backend.core.encryption import pii_cipher


class EncryptedString(TypeDecorator):
    """Encrypt/decrypt short PII strings using Fernet; stores ciphertext as text."""

    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        cipher = pii_cipher()
        return cipher.encrypt(value)

    def process_result_value(self, value, dialect):
        cipher = pii_cipher()
        return cipher.decrypt(value)


__all__ = ["EncryptedString"]
