from __future__ import annotations

from decimal import Decimal
from html import escape
from typing import Iterable

import httpx
from sqlalchemy import select

from brace_backend.core.config import settings
from brace_backend.core.logging import logger
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.order import Order
from brace_backend.domain.user import User

STATUS_LABELS = {
    "pending": "Новый",
    "processing": "В обработке",
    "shipped": "Отправлен",
    "delivered": "Доставлен",
    "cancelled": "Отменён",
}

ORDER_STATUS_ICON = {
    "pending": "❗️",
    "processing": "⚡️",
    "shipped": "🚚",
    "delivered": "✅",
    "cancelled": "❗️",
}

ORDER_ICON_CUSTOM = {
    "pending": "5379748062124056162",  # ❗️
    "processing": "5312016608254762256",  # ⚡️
    "shipped": "5312322066328853156",  # 🚚
    "delivered": "5237699328843200968",  # ✅
    "cancelled": "5379748062124056162",  # ❗️
}


def _format_money(minor_units: int) -> str:
    return f"{Decimal(minor_units) / Decimal(100):.2f} RUB"


def _admin_targets() -> tuple[str | None, list[int]]:
    if settings.admin_bot_token and settings.admin_chat_ids:
        return settings.admin_bot_token, settings.admin_chat_ids
    if settings.telegram_bot_token and settings.order_manager_telegram_id:
        return settings.telegram_bot_token, [settings.order_manager_telegram_id]
    return None, []


def _forum_chat_id() -> int | None:
    # Берём первый форумный чат (отрицательный id) из списка админов
    for cid in settings.admin_chat_ids:
        if cid < 0:
            return cid
    return None


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


async def _send_message(token: str, chat_id: int, text: str, reply_markup: dict | None = None, thread_id: int | None = None) -> None:
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    if thread_id is not None:
        payload["message_thread_id"] = thread_id
    async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
        response = await client.post(url, json=payload)
    response.raise_for_status()


async def notify_user_message(chat_id: int, text: str) -> bool:
    if not settings.telegram_bot_token:
        logger.warning("user_notify_skipped", reason="bot_token_missing", chat_id=str(chat_id))
        return False
    try:
        await _send_message(settings.telegram_bot_token, chat_id, text)
        return True
    except Exception as exc:  # pragma: no cover - external dependency
        logger.warning("user_notify_failed", chat_id=str(chat_id), error=str(exc))
        return False


async def notify_user_order_status(
    telegram_id: int,
    order_id: str,
    status: str,
    label: str,
    hint: str,
) -> bool:
    if not settings.telegram_bot_token:
        logger.warning(
            "order_status_notify_skipped",
            reason="bot_token_missing",
            order_id=order_id,
            status=status,
        )
        return False
    message = (
        f"Ваш заказ №{order_id} {label}. {hint}".strip()
        if status == "pending"
        else f"Заказ №{order_id} {label}.".strip()
    )
    if status == "shipped" and hint:
        message = f"Заказ №{order_id} {label}. {hint}".strip()
    if status == "delivered" and hint:
        message = f"Заказ №{order_id} {label}. {hint}".strip()
    if status == "completed" and hint:
        message = f"Заказ №{order_id} {label}. {hint}".strip()
    if status == "cancelled":
        message = f"Заказ №{order_id} {label}.".strip()
    try:
        await _send_message(settings.telegram_bot_token, telegram_id, message)
        return True
    except Exception:  # pragma: no cover - external dependency
        logger.exception(
            "order_status_notify_failed",
            order_id=order_id,
            status=status,
            telegram_id=str(telegram_id),
        )
        return False


def _build_order_message(order: Order, user: User) -> str:
    payable_minor_units = order.total_amount_minor_units - (order.bonus_applied_minor_units or 0)
    lines = [
        "Новый заказ",
        f"Заказ: {escape(str(order.id))}",
        f"Статус: {STATUS_LABELS.get(order.status, order.status)}",
        f"Сумма: {_format_money(order.total_amount_minor_units)}",
        *(
            [
                f"Списано бонусами: -{_format_money(order.bonus_applied_minor_units)}",
                f"К оплате: {_format_money(payable_minor_units)}",
            ]
            if order.bonus_applied_minor_units
            else []
        ),
        "",
        "Покупатель:",
        f"Телеграм ID: {escape(str(user.telegram_id))}",
        f"Username: @{escape(user.username)}" if user.username else "Username: —",
        f"ФИО: {escape(user.full_name)}" if getattr(user, "full_name", None) else "ФИО: —",
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


def _topic_name(order: Order) -> str:
    icon = ORDER_STATUS_ICON.get(order.status, "❗️")
    return f"{icon} Заказ #{order.id.hex[:6]} | {STATUS_LABELS.get(order.status, order.status)}"


async def _ensure_forum_thread(
    uow: UnitOfWork,
    client: httpx.AsyncClient,
    token: str,
    order: Order,
    forum_chat_id: int,
) -> int | None:
    if order.forum_thread_id:
        return order.forum_thread_id
    try:
        resp = await client.post(
            f"https://api.telegram.org/bot{token}/createForumTopic",
            json={
                "chat_id": forum_chat_id,
                "name": _topic_name(order),
                "icon_custom_emoji_id": ORDER_ICON_CUSTOM.get(order.status),
            },
        )
        data = resp.json()
        if data.get("ok") and data.get("result", {}).get("message_thread_id"):
            thread_id = int(data["result"]["message_thread_id"])
            order.forum_thread_id = thread_id
            await uow.commit()
            logger.info("order_forum_topic_created", order_id=str(order.id), thread_id=thread_id)
            return thread_id
        logger.warning("order_forum_topic_failed", order_id=str(order.id), response=data)
    except Exception as exc:  # pragma: no cover
        logger.warning("order_forum_topic_error", order_id=str(order.id), error=str(exc))
    return None


async def _edit_forum_topic(client: httpx.AsyncClient, token: str, forum_chat_id: int, thread_id: int, order: Order) -> None:
    try:
        await client.post(
            f"https://api.telegram.org/bot{token}/editForumTopic",
            json={
                "chat_id": forum_chat_id,
                "message_thread_id": thread_id,
                "name": _topic_name(order)[:128],
                "icon_custom_emoji_id": ORDER_ICON_CUSTOM.get(order.status),
            },
        )
    except Exception as exc:
        logger.warning("order_forum_topic_edit_failed", order_id=str(order.id), thread_id=thread_id, error=str(exc))


async def _send_order_to_forum(uow: UnitOfWork, order: Order, user: User) -> None:
    token = settings.admin_bot_token
    forum_chat_id = _forum_chat_id()
    if not token or not forum_chat_id:
        logger.info("order_forum_skip", reason="no_token_or_chat", order_id=str(order.id))
        return
    async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
        thread_id = order.forum_thread_id or await _ensure_forum_thread(uow, client, token, order, forum_chat_id)
        if not thread_id:
            return
        await _edit_forum_topic(client, token, forum_chat_id, thread_id, order)
        try:
            await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={
                    "chat_id": forum_chat_id,
                    "message_thread_id": thread_id,
                    "text": _build_order_message(order, user),
                    "reply_markup": _status_keyboard(str(order.id)),
                },
            )
            logger.info("order_forum_sent", order_id=str(order.id), thread_id=thread_id)
        except Exception as exc:  # pragma: no cover
            logger.warning("order_forum_send_failed", order_id=str(order.id), error=str(exc))


async def notify_manager_order(uow: UnitOfWork, order: Order, user: User) -> None:
    token, chat_ids = _admin_targets()
    if not chat_ids:
        logger.info("order_notify_skipped", reason="admin_chat_missing", order_id=str(order.id))
        return
    if not token:
        logger.warning("order_notify_skipped", reason="bot_token_missing", order_id=str(order.id))
        return

    message = _build_order_message(order, user)

    try:
        for chat_id in chat_ids:
            await _send_message(token, chat_id, message, reply_markup=_status_keyboard(str(order.id)))
    except Exception as exc:  # pragma: no cover - external dependency
        logger.warning(
            "order_notify_failed",
            order_id=str(order.id),
            error=str(exc),
        )

    try:
        await _send_order_to_forum(uow, order, user)
    except Exception as exc:  # pragma: no cover
        logger.warning("order_forum_notify_failed", order_id=str(order.id), error=str(exc))


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


async def notify_manager_account_deleted(user: User, order_ids: list[str]) -> None:
    token, chat_ids = _admin_targets()
    if not chat_ids:
        logger.info("account_delete_notify_skipped", reason="admin_chat_missing", user_id=str(user.id))
        return
    if not token:
        logger.warning("account_delete_notify_skipped", reason="bot_token_missing", user_id=str(user.id))
        return

    lines = [
        "Аккаунт удалён",
        f"Пользователь: {escape(str(user.id))}",
        f"Телеграм ID: {escape(str(user.telegram_id))}",
        f"Username: @{escape(user.username)}" if user.username else "Username: —",
        "",
    ]
    if order_ids:
        lines.append("Отменённые заказы:")
        lines.extend([f"- {escape(order_id)}" for order_id in order_ids])
    else:
        lines.append("Отменённые заказы: —")
    message = "\n".join(lines)

    try:
        for chat_id in chat_ids:
            await _send_message(token, chat_id, message)
    except Exception as exc:  # pragma: no cover - external dependency
        logger.warning(
            "account_delete_notify_failed",
            user_id=str(user.id),
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
