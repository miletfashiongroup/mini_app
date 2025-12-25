from __future__ import annotations

import asyncio
from html import escape
from typing import Any
from uuid import UUID

import httpx

from brace_backend.core.config import settings
from brace_backend.core.logging import logger
from brace_backend.db.session import session_manager
from brace_backend.db.uow import UnitOfWork
from brace_backend.services.order_service import order_service

STATUS_LABELS = {
    "pending": "Новый",
    "processing": "В обработке",
    "shipped": "Отправлен",
    "delivered": "Доставлен",
    "cancelled": "Отменён",
}


def _status_keyboard(order_id: str) -> dict[str, Any]:
    return {
        "inline_keyboard": [
            [
                {"text": "Новый", "callback_data": f"status:{order_id}:pending"},
                {"text": "В обработке", "callback_data": f"status:{order_id}:processing"},
            ],
            [
                {"text": "Отправлен", "callback_data": f"status:{order_id}:shipped"},
                {"text": "Доставлен", "callback_data": f"status:{order_id}:delivered"},
            ],
            [
                {"text": "Отменён", "callback_data": f"status:{order_id}:cancelled"},
            ],
        ],
    }


def _format_money(minor_units: int) -> str:
    return f"{minor_units / 100:.2f} RUB"


def _format_order_message(order) -> str:
    lines = [
        "Заказ",
        f"ID: {escape(str(order.id))}",
        f"Статус: {STATUS_LABELS.get(order.status, order.status)}",
        f"Сумма: {_format_money(order.total_amount_minor_units)}",
        "",
        "Состав:",
    ]
    for item in order.items:
        product_code = None
        if item.product is not None:
            product_code = item.product.product_code
        lines.append(
            f"- {escape(product_code) if product_code else escape(str(item.product_id))} | "
            f"размер {escape(item.size)} | x{item.quantity} | "
            f"{_format_money(item.unit_price_minor_units)}"
        )
    return "\n".join(lines)


class AdminBot:
    def __init__(self) -> None:
        self.token = (settings.admin_bot_token or "").strip()
        self.allowed_admins = set(settings.admin_chat_ids)
        self.api_base = f"https://api.telegram.org/bot{self.token}"
        self.offset = 0

    def _is_admin(self, user_id: int) -> bool:
        return user_id in self.allowed_admins

    async def _send_message(
        self, client: httpx.AsyncClient, chat_id: int, text: str, reply_markup: dict | None = None
    ) -> None:
        payload: dict[str, Any] = {"chat_id": chat_id, "text": text}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        response = await client.post(f"{self.api_base}/sendMessage", json=payload)
        response.raise_for_status()

    async def _answer_callback(self, client: httpx.AsyncClient, callback_id: str, text: str) -> None:
        response = await client.post(
            f"{self.api_base}/answerCallbackQuery",
            json={"callback_query_id": callback_id, "text": text},
        )
        response.raise_for_status()

    async def _set_status(self, order_id: UUID, status: str):
        async with session_manager.session() as session:
            uow = UnitOfWork(session)
            return await order_service.set_status_admin(uow, order_id=order_id, status=status)

    async def _handle_command(self, client: httpx.AsyncClient, chat_id: int, text: str) -> None:
        parts = text.strip().split()
        command = parts[0].lower()

        if command in ("/start", "/help"):
            await self._send_message(
                client,
                chat_id,
                "Админ-бот заказов.\n\n"
                "Команды:\n"
                "/orders — последние заказы\n"
                "/order <id> — детали заказа\n",
            )
            return

        if command == "/orders":
            async with session_manager.session() as session:
                uow = UnitOfWork(session)
                orders = await uow.orders.list_recent(limit=10)
                if not orders:
                    await self._send_message(client, chat_id, "Заказов пока нет.")
                    return
                for order in orders:
                    await self._send_message(
                        client,
                        chat_id,
                        _format_order_message(order),
                        reply_markup=_status_keyboard(str(order.id)),
                    )
            return

        if command == "/order":
            if len(parts) < 2:
                await self._send_message(client, chat_id, "Укажи id заказа: /order <id>")
                return
            try:
                order_id = UUID(parts[1])
            except ValueError:
                await self._send_message(client, chat_id, "Некорректный id заказа.")
                return
            async with session_manager.session() as session:
                uow = UnitOfWork(session)
                order = await uow.orders.get_by_id(order_id=order_id)
                if not order:
                    await self._send_message(client, chat_id, "Заказ не найден.")
                    return
                user = await uow.users.get(order.user_id)
                message = _format_order_message(order)
                if user:
                    contact_lines = [
                        "Покупатель:",
                        f"Телеграм ID: {escape(str(user.telegram_id))}",
                        f"Username: @{escape(user.username)}" if user.username else "Username: —",
                        f"Телефон: {escape(user.phone)}" if user.phone else "Телефон: —",
                    ]
                    message = "\n".join(contact_lines) + "\n\n" + message
                await self._send_message(
                    client,
                    chat_id,
                    message,
                    reply_markup=_status_keyboard(str(order.id)),
                )
            return

        await self._send_message(client, chat_id, "Неизвестная команда. /help")

    async def _handle_callback(self, client: httpx.AsyncClient, callback: dict[str, Any]) -> None:
        callback_id = callback.get("id")
        from_user = callback.get("from", {})
        user_id = from_user.get("id")
        data = callback.get("data", "")
        if not callback_id or not isinstance(user_id, int):
            return
        if not self._is_admin(user_id):
            await self._answer_callback(client, callback_id, "Нет доступа.")
            return
        if not data.startswith("status:"):
            await self._answer_callback(client, callback_id, "Неизвестное действие.")
            return
        _, order_id_str, status = data.split(":", 2)
        try:
            order_id = UUID(order_id_str)
        except ValueError:
            await self._answer_callback(client, callback_id, "Некорректный заказ.")
            return
        try:
            await self._set_status(order_id, status)
            await self._answer_callback(client, callback_id, f"Статус: {STATUS_LABELS.get(status, status)}")
        except Exception as exc:
            logger.warning("admin_bot_status_failed", order_id=str(order_id), error=str(exc))
            await self._answer_callback(client, callback_id, "Не удалось обновить статус.")

    async def run(self) -> None:
        if not self.token or not self.allowed_admins:
            logger.warning("admin_bot_disabled", reason="missing_token_or_admins")
            while True:
                await asyncio.sleep(60)

        async with httpx.AsyncClient(timeout=httpx.Timeout(25.0)) as client:
            logger.info("admin_bot_started", admins=len(self.allowed_admins))
            while True:
                try:
                    response = await client.post(
                        f"{self.api_base}/getUpdates",
                        json={"offset": self.offset, "timeout": 20},
                    )
                    response.raise_for_status()
                    data = response.json()
                    updates = data.get("result", [])
                    for update in updates:
                        update_id = update.get("update_id")
                        if isinstance(update_id, int):
                            self.offset = update_id + 1
                        if "message" in update:
                            message = update["message"]
                            chat = message.get("chat", {})
                            chat_id = chat.get("id")
                            text = message.get("text") or ""
                            user_id = message.get("from", {}).get("id")
                            if not isinstance(chat_id, int) or not isinstance(user_id, int):
                                continue
                            if not self._is_admin(user_id):
                                await self._send_message(client, chat_id, "Нет доступа.")
                                continue
                            await self._handle_command(client, chat_id, text)
                        if "callback_query" in update:
                            await self._handle_callback(client, update["callback_query"])
                except Exception as exc:
                    logger.warning("admin_bot_poll_failed", error=str(exc))
                    await asyncio.sleep(2)


async def main() -> None:
    bot = AdminBot()
    await bot.run()


if __name__ == "__main__":
    asyncio.run(main())
