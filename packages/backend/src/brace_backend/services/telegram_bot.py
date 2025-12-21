from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any

import httpx

from brace_backend.core.config import settings
from brace_backend.core.logging import logger
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.user import User
from brace_backend.services.audit_service import audit_service


CONSENT_TEXT = "Вы согласны на обработку ваших данных?"
SKIP_EMAIL_VALUES = {"пропустить", "skip", "нет"}


def _normalize_phone(value: str) -> str:
    digits_only = "".join(ch for ch in (value or "") if ch.isdigit())
    if digits_only.startswith("00"):
        digits_only = digits_only[2:]
    if len(digits_only) < 8 or len(digits_only) > 15:
        raise ValueError("Телефон некорректен.")
    return f"+{digits_only}"


def _parse_birth_date(value: str) -> date:
    value = (value or "").strip()
    for fmt in ("%d.%m.%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    raise ValueError("Дата рождения должна быть в формате ДД.ММ.ГГГГ.")


def _parse_gender(value: str) -> str:
    value = (value or "").strip().lower()
    if value in {"м", "муж", "мужской", "male"}:
        return "male"
    if value in {"ж", "жен", "женский", "female"}:
        return "female"
    raise ValueError("Пол должен быть 'Мужской' или 'Женский'.")


def _parse_email(value: str) -> str:
    value = (value or "").strip()
    if not value or "@" not in value or "." not in value:
        raise ValueError("Email некорректен.")
    return value


def _next_step(user: User) -> str | None:
    if not user.consent_given_at:
        return "consent"
    if not user.phone:
        return "phone"
    if not user.full_name:
        return "full_name"
    if not user.birth_date:
        return "birth_date"
    if not user.gender:
        return "gender"
    if not user.email and not user.email_opt_out:
        return "email"
    return None


@dataclass
class TelegramBotService:
    token: str

    async def handle_update(self, uow: UnitOfWork, payload: dict[str, Any]) -> None:
        if "message" in payload:
            await self._handle_message(uow, payload["message"])
            return
        if "callback_query" in payload:
            await self._handle_callback(uow, payload["callback_query"])

    async def _handle_message(self, uow: UnitOfWork, message: dict[str, Any]) -> None:
        text = (message.get("text") or "").strip()
        sender = message.get("from") or {}
        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        if not chat_id:
            return

        user = await self._sync_user(uow, sender)
        if not user:
            return

        if text.startswith("/start"):
            await self._prompt_next(uow, chat_id, user)
            return

        contact = message.get("contact")
        if contact and _next_step(user) == "phone":
            await self._handle_phone(uow, chat_id, user, contact)
            return

        await self._handle_text_step(uow, chat_id, user, text)

    async def _handle_callback(self, uow: UnitOfWork, callback: dict[str, Any]) -> None:
        data = (callback.get("data") or "").strip()
        sender = callback.get("from") or {}
        message = callback.get("message") or {}
        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        if not chat_id:
            return

        user = await self._sync_user(uow, sender)
        if not user:
            return

        if data == "consent_yes":
            await self._record_consent(uow, user)
            await self._prompt_next(uow, chat_id, user)
            return
        if data == "consent_no":
            await self._send_message(
                chat_id,
                "Без согласия мы не можем продолжить работу. Если передумаете, отправьте /start.",
            )

    async def _handle_phone(
        self, uow: UnitOfWork, chat_id: int, user: User, contact: dict[str, Any]
    ) -> None:
        phone = contact.get("phone_number") or ""
        try:
            user.phone = _normalize_phone(phone)
        except ValueError as exc:
            await self._send_message(chat_id, str(exc))
            return
        await audit_service.log(
            uow,
            action="profile_phone_set",
            entity_type="user",
            entity_id=str(user.id),
            actor_user_id=user.id,
        )
        await uow.commit()
        await uow.refresh(user)
        await self._prompt_next(uow, chat_id, user)

    async def _handle_text_step(self, uow: UnitOfWork, chat_id: int, user: User, text: str) -> None:
        step = _next_step(user)
        if step == "full_name":
            if len(text) < 2:
                await self._send_message(chat_id, "Введите ФИО полностью.")
                return
            user.full_name = " ".join(text.split())
            await audit_service.log(
                uow,
                action="profile_full_name_set",
                entity_type="user",
                entity_id=str(user.id),
                actor_user_id=user.id,
            )
        elif step == "birth_date":
            try:
                user.birth_date = _parse_birth_date(text)
            except ValueError as exc:
                await self._send_message(chat_id, str(exc))
                return
        elif step == "gender":
            try:
                user.gender = _parse_gender(text)
            except ValueError as exc:
                await self._send_message(chat_id, str(exc))
                return
        elif step == "email":
            if text.lower() in SKIP_EMAIL_VALUES:
                user.email_opt_out = True
            else:
                try:
                    user.email = _parse_email(text)
                except ValueError as exc:
                    await self._send_message(chat_id, str(exc))
                    return
        else:
            return

        await uow.commit()
        await uow.refresh(user)
        await self._prompt_next(uow, chat_id, user)

    async def _record_consent(self, uow: UnitOfWork, user: User) -> None:
        if user.consent_given_at:
            return
        user.consent_given_at = datetime.now(timezone.utc)
        user.consent_text = CONSENT_TEXT
        await audit_service.log(
            uow,
            action="consent_granted",
            entity_type="user",
            entity_id=str(user.id),
            actor_user_id=user.id,
        )
        await uow.commit()
        await uow.refresh(user)

    async def _prompt_next(self, uow: UnitOfWork, chat_id: int, user: User) -> None:
        step = _next_step(user)
        if step is None:
            if user.profile_completed_at is None:
                user.profile_completed_at = datetime.now(timezone.utc)
                await uow.commit()
            await self._send_message(chat_id, "Спасибо! Данные сохранены.")
            return
        if step == "consent":
            await self._send_message(
                chat_id,
                CONSENT_TEXT,
                reply_markup={
                    "inline_keyboard": [[
                        {"text": "Да", "callback_data": "consent_yes"},
                        {"text": "Нет", "callback_data": "consent_no"},
                    ]]
                },
            )
        elif step == "phone":
            await self._send_message(
                chat_id,
                "Пожалуйста, поделитесь контактным телефоном.",
                reply_markup={
                    "keyboard": [[{"text": "Поделиться контактом", "request_contact": True}]],
                    "resize_keyboard": True,
                    "one_time_keyboard": True,
                },
            )
        elif step == "full_name":
            await self._send_message(chat_id, "Введите ФИО полностью.")
        elif step == "birth_date":
            await self._send_message(chat_id, "Введите дату рождения в формате ДД.ММ.ГГГГ.")
        elif step == "gender":
            await self._send_message(
                chat_id,
                "Выберите пол:",
                reply_markup={
                    "keyboard": [[{"text": "Мужской"}, {"text": "Женский"}]],
                    "resize_keyboard": True,
                    "one_time_keyboard": True,
                },
            )
        elif step == "email":
            await self._send_message(chat_id, "Введите email или отправьте 'Пропустить'.")

    async def _sync_user(self, uow: UnitOfWork, sender: dict[str, Any]) -> User | None:
        telegram_id = sender.get("id")
        if not telegram_id:
            return None
        user = await uow.users.get_by_telegram_id(int(telegram_id))
        if user:
            user.first_name = sender.get("first_name")
            user.last_name = sender.get("last_name")
            user.username = sender.get("username")
            user.language_code = sender.get("language_code")
        else:
            user = User(
                telegram_id=int(telegram_id),
                first_name=sender.get("first_name"),
                last_name=sender.get("last_name"),
                username=sender.get("username"),
                language_code=sender.get("language_code"),
            )
            await uow.users.add(user)
        await uow.commit()
        await uow.refresh(user)
        return user

    async def _send_message(
        self, chat_id: int, text: str, reply_markup: dict[str, Any] | None = None
    ) -> None:
        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        payload = {"chat_id": chat_id, "text": text}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(6.0)) as client:
                response = await client.post(url, json=payload)
            response.raise_for_status()
        except Exception as exc:  # pragma: no cover - external dependency
            logger.warning("telegram_bot_send_failed", error=str(exc), chat_id=str(chat_id))


telegram_bot_service = TelegramBotService(token=settings.telegram_bot_token or "")
