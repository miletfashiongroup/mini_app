from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import delete

from brace_backend.core.exceptions import ValidationError
from brace_backend.core.security import TelegramInitData
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.audit import AuditLog
from brace_backend.domain.user import User
from brace_backend.schemas.users import UserProfileUpdate
from brace_backend.services.audit_service import audit_service
from brace_backend.services.telegram_notify import notify_manager_account_deleted


class UserService:
    async def sync_from_telegram(self, uow: UnitOfWork, init_data: TelegramInitData) -> User:
        payload = init_data.user
        telegram_id = payload.get("id")
        if telegram_id is None:
            raise ValidationError("Telegram payload is missing the `id` field.")

        user = await uow.users.get_by_telegram_id(int(telegram_id))
        if user:
            await uow.users.update_from_payload(user, payload)
        else:
            user = User(
                telegram_id=int(telegram_id),
                first_name=payload.get("first_name"),
                last_name=payload.get("last_name"),
                username=payload.get("username"),
                language_code=payload.get("language_code"),
            )
            await uow.users.add(user)

        await uow.commit()
        await uow.refresh(user)
        return user

    async def record_consent(
        self,
        uow: UnitOfWork,
        user: User,
        *,
        consent_text: str,
        client_ip: str | None,
        user_agent: str | None,
    ) -> User:
        if user.consent_given_at:
            return user
        user.consent_given_at = datetime.now(timezone.utc)
        user.consent_text = consent_text.strip()[:512] if consent_text else None
        user.consent_ip = client_ip
        user.consent_user_agent = user_agent
        await audit_service.log(
            uow,
            action="consent_granted",
            entity_type="user",
            entity_id=str(user.id),
            actor_user_id=user.id,
            ip_address=client_ip,
            user_agent=user_agent,
            metadata={"consent_text": user.consent_text},
        )
        await uow.commit()
        await uow.refresh(user)
        return user

    async def update_profile(
        self,
        uow: UnitOfWork,
        user: User,
        *,
        payload: UserProfileUpdate,
        client_ip: str | None,
        user_agent: str | None,
    ) -> User:
        if not user.consent_given_at:
            raise ValidationError("Consent is required before submitting profile data.")
        user.full_name = payload.full_name
        user.phone = payload.phone
        user.email = payload.email
        user.birth_date = payload.birth_date
        user.gender = payload.gender

        if user.profile_completed_at is None:
            user.profile_completed_at = datetime.now(timezone.utc)

        await audit_service.log(
            uow,
            action="profile_updated",
            entity_type="user",
            entity_id=str(user.id),
            actor_user_id=user.id,
            ip_address=client_ip,
            user_agent=user_agent,
            metadata={"fields": ["full_name", "phone", "email", "birth_date", "gender"]},
        )
        await uow.commit()
        await uow.refresh(user)
        return user

    async def delete_account(self, uow: UnitOfWork, user: User) -> None:
        orders, _ = await uow.orders.list_for_user(user.id)
        order_ids = [str(order.id) for order in orders]
        for order in orders:
            if order.status != "cancelled":
                order.status = "cancelled"
            await uow.orders.delete(order)
        await uow.session.execute(
            delete(AuditLog).where(AuditLog.actor_user_id == user.id)
        )
        await uow.session.delete(user)
        await uow.commit()
        await notify_manager_account_deleted(user, order_ids)


user_service = UserService()

__all__ = ["user_service", "UserService"]
