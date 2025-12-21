from datetime import date, datetime
import re
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator, model_validator


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    telegram_id: int
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    language_code: str | None = None
    full_name: str | None = None
    phone: str | None = None
    email: str | None = None
    email_opt_out: bool | None = None
    birth_date: date | None = None
    gender: str | None = None
    consent_given_at: datetime | None = None
    profile_completed_at: datetime | None = None


class UserConsentRequest(BaseModel):
    consent: bool
    consent_text: str | None = None

    @model_validator(mode="after")
    def ensure_consent_text(self) -> "UserConsentRequest":
        if self.consent and not (self.consent_text or "").strip():
            raise ValueError("Consent text is required when consent is granted.")
        return self


class UserProfileUpdate(BaseModel):
    full_name: str
    phone: str
    email: str | None = None
    birth_date: date
    gender: Literal["male", "female"]

    @field_validator("full_name", mode="before")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        cleaned = " ".join((value or "").strip().split())
        if len(cleaned) < 2:
            raise ValueError("Full name is required.")
        return cleaned

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        digits_only = "".join(ch for ch in (value or "") if ch.isdigit())
        if digits_only.startswith("00"):
            digits_only = digits_only[2:]
        if len(digits_only) < 8 or len(digits_only) > 15:
            raise ValueError("Phone number is invalid.")
        return f"+{digits_only}"

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            return None
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", cleaned):
            raise ValueError("Email is invalid.")
        return cleaned
