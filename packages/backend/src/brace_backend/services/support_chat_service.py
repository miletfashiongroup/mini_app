from __future__ import annotations

from uuid import UUID

import httpx

from brace_backend.core.config import settings
from brace_backend.core.logging import logger
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.support import SupportTicket
from brace_backend.domain.support_message import SupportMessage


class SupportChatService:
    async def _order_summary(self, uow: UnitOfWork, ticket: SupportTicket) -> str | None:
        if not ticket.order_id:
            return None
        order = await uow.orders.get_by_id(order_id=ticket.order_id)
        if not order or not getattr(order, "items", None):
            return None
        parts = []
        for item in order.items:
            code = None
            if getattr(item, "product", None):
                code = getattr(item.product, "product_code", None)
            parts.append(f"{code or item.product_id} x{item.quantity} size {item.size}")
        return "; ".join(parts) if parts else None

    async def _format_header(
        self,
        uow: UnitOfWork,
        ticket: SupportTicket,
        *,
        contact: str | None,
        username: str | None,
        phone: str | None,
    ) -> str:
        status = ticket.status
        priority = ticket.priority
        category = (ticket.meta or {}).get("category")
        order_summary = await self._order_summary(uow, ticket)
        lines = [
            f"Статус: {status} | Приоритет: {priority} | Категория: {category or '-'}",
            f"Телефон: {phone or '-'} | Username: @{username}" if username else f"Телефон: {phone or '-'} | Username: -",
            f"Тема: {ticket.subject}",
        ]
        if contact:
            lines.append(f"Контакт: {contact}")
        if order_summary:
            lines.append(f"Состав: {order_summary}")
        return "\n".join(lines)

    async def send_user_message(
        self,
        uow: UnitOfWork,
        *,
        ticket: SupportTicket,
        user_id: UUID,
        text: str,
    ) -> SupportMessage:
        message = SupportMessage(ticket_id=ticket.id, sender="user", text=text.strip())
        await uow.support_messages.add(message)
        await uow.commit()

        user = await uow.users.get(user_id)
        username = user.username if user else None
        phone = user.phone if user else None
        contact = (ticket.meta or {}).get("contact")

        token = (settings.support_bot_token or settings.admin_bot_token or "").strip()
        chat_ids = settings.support_chat_ids or settings.admin_chat_ids
        thread_id = (ticket.meta or {}).get("thread_id")
        if not token or not chat_ids or not thread_id:
            return message

        header = await self._format_header(uow, ticket, contact=contact, username=username, phone=phone)
        text_body = f"{header}\n\nСообщение: {text.strip()}"
        async with httpx.AsyncClient(timeout=5.0) as client:
            for chat_id in chat_ids:
                try:
                    await client.post(
                        f"https://api.telegram.org/bot{token}/sendMessage",
                        json={
                            "chat_id": chat_id,
                            "text": text_body,
                            "message_thread_id": thread_id,
                        },
                    )
                except Exception as exc:  # pragma: no cover - logging only
                    logger.warning(
                        "support_chat_send_failed",
                        chat_id=chat_id,
                        ticket_id=str(ticket.id),
                        error=str(exc),
                    )
        return message

    async def add_admin_message(
        self,
        uow: UnitOfWork,
        *,
        ticket: SupportTicket,
        text: str,
    ) -> SupportMessage:
        message = SupportMessage(ticket_id=ticket.id, sender="admin", text=text.strip())
        await uow.support_messages.add(message)
        await uow.commit()
        return message

    async def list_messages(
        self, uow: UnitOfWork, *, ticket_id: UUID, limit: int = 200, offset: int = 0
    ) -> list[SupportMessage]:
        return await uow.support_messages.list_for_ticket(ticket_id=ticket_id, limit=limit, offset=offset)


support_chat_service = SupportChatService()

__all__ = ["support_chat_service", "SupportChatService"]
