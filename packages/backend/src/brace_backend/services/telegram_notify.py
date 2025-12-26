from __future__ import annotations

from decimal import Decimal
from html import escape

import httpx

from brace_backend.core.config import settings
from brace_backend.core.logging import logger
from brace_backend.domain.order import Order
from brace_backend.domain.user import User


def _format_money(minor_units: int) -> str:
    return f"{Decimal(minor_units) / Decimal(100):.2f} RUB"

def _admin_targets() -> tuple[str | None, list[int]]:
    if settings.admin_bot_token and settings.admin_chat_ids:
        return settings.admin_bot_token, settings.admin_chat_ids
    if settings.telegram_bot_token and settings.order_manager_telegram_id:
        return settings.telegram_bot_token, [settings.order_manager_telegram_id]
    return None, []

def _status_keyboard(order_id: str) -> dict[str, object]:
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
        ]
    }

async def _send_message(token: str, chat_id: int, text: str, reply_markup: dict | None = None) -> None:
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
        response = await client.post(url, json=payload)
    response.raise_for_status()


def _build_order_message(order: Order, user: User) -> str:
    lines = [
        "Новый заказ",
        f"Заказ: {escape(str(order.id))}",
        f"Сумма: {_format_money(order.total_amount_minor_units)}",
        "",
        "Покупатель:",
        f"Телеграм ID: {escape(str(user.telegram_id))}",
        f"Username: @{escape(user.username)}" if user.username else "Username: —",
        f"ФИО: {escape(user.full_name)}" if user.full_name else "ФИО: —",
        f"Телефон: {escape(user.phone)}" if user.phone else "Телефон: —",
        f"Email: {escape(user.email)}" if user.email else "Email: —",
        "",
        "Доставка:",
        f"Адрес: {escape(order.shipping_address)}" if order.shipping_address else "Адрес: —",
        f"Комментарий: {escape(order.note)}" if order.note else "Комментарий: —",
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


async def notify_manager_order(order: Order, user: User) -> None:
    token, chat_ids = _admin_targets()
    if not chat_ids:
        logger.info("order_notify_skipped", reason="admin_chat_missing", order_id=str(order.id))
        return
    if not token:
        logger.warning("order_notify_skipped", reason="bot_token_missing", order_id=str(order.id))
        return

    message = _build_order_message(order, user)

    try:
        reply_markup = _status_keyboard(str(order.id)) if settings.admin_bot_token else None
        for chat_id in chat_ids:
            await _send_message(token, chat_id, message, reply_markup=reply_markup)
    except Exception as exc:  # pragma: no cover - external dependency
        logger.warning(
            "order_notify_failed",
            order_id=str(order.id),
            error=str(exc),
        )


async def notify_manager_order_cancel(order: Order, user: User) -> None:
    token, chat_ids = _admin_targets()
    if not chat_ids:
        logger.info("order_cancel_notify_skipped", reason="admin_chat_missing", order_id=str(order.id))
        return
    if not token:
        logger.warning("order_cancel_notify_skipped", reason="bot_token_missing", order_id=str(order.id))
        return

    lines = [
        "Отмена заказа",
        f"Заказ: {escape(str(order.id))}",
        f"Сумма: {_format_money(order.total_amount_minor_units)}",
        f"Телеграм ID: {escape(str(user.telegram_id))}",
        f"Username: @{escape(user.username)}" if user.username else "Username: —",
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
    message = "\n".join(lines)
    try:
        for chat_id in chat_ids:
            await _send_message(token, chat_id, message)
    except Exception as exc:  # pragma: no cover - external dependency
        logger.warning(
            "order_cancel_notify_failed",
            order_id=str(order.id),
            error=str(exc),
        )


async def send_analytics_report(message: str, *, report_type: str, retries: int = 2) -> bool:
    if not settings.analytics_report_recipient_ids:
        logger.info("analytics_report_skipped", reason="recipients_missing", report_type=report_type)
        return False
    if not settings.telegram_bot_token:
        logger.warning("analytics_report_skipped", reason="bot_token_missing", report_type=report_type)
        return False

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    payloads = [{"chat_id": chat_id, "text": message} for chat_id in settings.analytics_report_recipient_ids]
    attempt = 0
    while True:
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                for payload in payloads:
                    response = await client.post(url, json=payload)
                    response.raise_for_status()
            return True
        except Exception as exc:  # pragma: no cover - external dependency
            attempt += 1
            if attempt > retries:
                logger.warning(
                    "analytics_report_failed",
                    report_type=report_type,
                    error=str(exc),
                )
                return False
