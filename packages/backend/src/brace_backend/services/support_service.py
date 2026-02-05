from __future__ import annotations

from uuid import UUID

import httpx

from brace_backend.core.config import settings
from brace_backend.core.exceptions import ValidationError
from brace_backend.core.logging import logger
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.support import SupportTicket
from brace_backend.services.support_chat_service import support_chat_service

STATUS_ICON = {"open": "❗️", "closed": "✅", "resolved": "✅"}
ICON_CUSTOM = {"open": "5379748062124056162", "closed": "5237699328843200968", "resolved": "5237699328843200968"}



class SupportService:
    _allowed_priorities = {"low", "normal", "high", "urgent"}
    _allowed_statuses = {"open", "closed", "resolved"}

    async def create_ticket(
        self,
        uow: UnitOfWork,
        *,
        user_id: UUID,
        subject: str,
        message: str,
        order_id: UUID | None = None,
        priority: str = "normal",
        contact: str | None = None,
        category: str | None = None,
    ) -> SupportTicket:
        if not subject.strip():
            raise ValidationError("Subject is required.")
        if not message.strip():
            raise ValidationError("Message is required.")
        priority_value = (priority or "normal").strip().lower()
        if priority_value not in self._allowed_priorities:
            raise ValidationError("Invalid priority.")

        ticket = SupportTicket(
            user_id=user_id,
            order_id=order_id,
            subject=subject.strip(),
            message=message.strip(),
            priority=priority_value,
            status="open",
            meta={
                "contact": (contact or "").strip() or None,
                "category": (category or "").strip() or None,
            },
        )
        await uow.support_tickets.add(ticket)
        await uow.commit()
        await uow.session.refresh(
            ticket,
            attribute_names=[
                "id",
                "user_id",
                "order_id",
                "status",
                "priority",
                "subject",
                "message",
                "manager_comment",
                "meta",
                "created_at",
                "updated_at",
            ],
        )

        await self._notify_admins(uow, ticket)

        ticket = await uow.session.get(SupportTicket, ticket.id)
        await uow.session.refresh(
            ticket,
            attribute_names=[
                "id",
                "user_id",
                "order_id",
                "status",
                "priority",
                "subject",
                "message",
                "manager_comment",
                "meta",
                "created_at",
                "updated_at",
            ],
        )

        await support_chat_service.send_user_message(uow, ticket=ticket, user_id=user_id, text=ticket.message)
        return ticket

    async def update_status(
        self,
        uow: UnitOfWork,
        *,
        ticket: SupportTicket,
        status: str,
    ) -> SupportTicket:
        status_value = (status or "").strip().lower()
        if status_value not in self._allowed_statuses:
            raise ValidationError("Invalid status.")
        if ticket.status == status_value:
            return ticket
        ticket.status = status_value
        await uow.session.commit()
        await uow.session.refresh(ticket)
        return ticket

    async def _create_forum_topic(
        self, client: httpx.AsyncClient, *, token: str, chat_id: int, ticket: SupportTicket
    ) -> int | None:
        icon = STATUS_ICON.get(ticket.status, "❗️")
        name = f"{icon} #{ticket.id.hex[:6]} | {ticket.subject[:64]}"
        icon_id = ICON_CUSTOM.get(ticket.status)
        try:
            resp = await client.post(
                f"https://api.telegram.org/bot{token}/createForumTopic",
                json={"chat_id": chat_id, "name": name, "icon_custom_emoji_id": icon_id},
            )
            data = resp.json()
            if data.get("ok") and data.get("result", {}).get("message_thread_id"):
                thread_id = int(data["result"]["message_thread_id"])
                try:
                    await client.post(
                        f"https://api.telegram.org/bot{token}/setForumTopicName",
                        json={"chat_id": chat_id, "message_thread_id": thread_id, "name": name[:128]},
                    )
                except Exception as exc:
                    logger.warning("support_topic_rename_failed", chat_id=chat_id, thread_id=thread_id, error=str(exc))
                if icon_id:
                    try:
                        await client.post(
                            f"https://api.telegram.org/bot{token}/setForumTopicIconCustomEmoji",
                            json={"chat_id": chat_id, "message_thread_id": thread_id, "icon_custom_emoji_id": icon_id},
                        )
                    except Exception as exc:
                        logger.warning("support_topic_icon_failed", chat_id=chat_id, thread_id=thread_id, error=str(exc))
                return thread_id
            logger.warning(
                "support_topic_create_failed",
                chat_id=chat_id,
                ticket_id=str(ticket.id),
                response=data,
            )
        except Exception as exc:  # pragma: no cover - best-effort log
            logger.warning(
                "support_topic_create_error", chat_id=chat_id, ticket_id=str(ticket.id), error=str(exc)
            )
        return None

    def _status_keyboard(self, ticket_id: UUID, status: str) -> dict:
        return {
            "inline_keyboard": [
                [
                    {
                        "text": "✅ Открыт" if status == "open" else "Открыть",
                        "callback_data": f"status:{ticket_id}:open",
                    },
                    {
                        "text": "✅ Закрыт" if status == "closed" else "Закрыть",
                        "callback_data": f"status:{ticket_id}:closed",
                    },
                ]
            ]
        }

    async def _notify_admins(self, uow: UnitOfWork, ticket: SupportTicket) -> None:
        token = (settings.support_bot_token or settings.admin_bot_token or "").strip()
        chat_ids = settings.support_chat_ids or settings.admin_chat_ids
        if not token or not chat_ids:
            logger.debug("Support notifications skipped: token or chat ids missing")
            return

        user = await uow.users.get(ticket.user_id)
        contact = ticket.meta.get("contact") if ticket.meta else None
        category = ticket.meta.get("category") if ticket.meta else None
        placeholder = "-"
        lines = [
            "[support] Новое обращение",
            f"ID: {ticket.id}",
            f"Статус: {ticket.status}",
            f"Приоритет: {ticket.priority}",
            f"Тема: {ticket.subject}",
            f"Сообщение: {ticket.message}",
            f"Категория: {category or placeholder}",
            f"Контакт: {contact or placeholder}",
        ]
        if ticket.order_id:
            lines.append(f"Order ID: {ticket.order_id}")
        if user:
            lines.append("--- Пользователь")
            lines.append(f"User ID: {user.id}")
            lines.append(f"Telegram ID: {user.telegram_id or placeholder}")
            lines.append(f"Username: @{user.username}" if user.username else "Username: -")
            lines.append(f"Телефон: {user.phone or placeholder}")
        text = "\n".join(lines)

        meta_updated = False
        async with httpx.AsyncClient(timeout=5.0) as client:
            for chat_id in chat_ids:
                message_thread_id = None
                topic_id = await self._create_forum_topic(client, token=token, chat_id=chat_id, ticket=ticket)
                if topic_id:
                    message_thread_id = topic_id
                    ticket.meta = (ticket.meta or {}) | {"thread_id": topic_id}
                    meta_updated = True
                payload = {
                    "chat_id": chat_id,
                    "text": text,
                    "reply_markup": self._status_keyboard(ticket.id, ticket.status),
                }
                if message_thread_id:
                    payload["message_thread_id"] = message_thread_id
                try:
                    await client.post(
                        f"https://api.telegram.org/bot{token}/sendMessage",
                        json=payload,
                    )
                except Exception as exc:  # pragma: no cover - logging only
                    logger.warning(
                        "support_notify_failed",
                        chat_id=chat_id,
                        ticket_id=str(ticket.id),
                        error=str(exc),
                    )
                else:
                    logger.debug(
                        "support_notified", chat_id=chat_id, ticket_id=str(ticket.id), thread_id=message_thread_id
                    )

        if meta_updated:
            await uow.session.commit()

    async def list_tickets(
        self, uow: UnitOfWork, *, status: str | None, limit: int, offset: int
    ) -> list[SupportTicket]:
        return await uow.support_tickets.list_all(status=status, limit=limit, offset=offset)


support_service = SupportService()

__all__ = ["support_service", "SupportService"]
