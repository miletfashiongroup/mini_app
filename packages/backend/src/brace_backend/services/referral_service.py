from __future__ import annotations

import secrets
import string
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.exc import IntegrityError

from brace_backend.core.config import settings
from brace_backend.core.exceptions import ConflictError, ValidationError
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.referral import ReferralBinding, ReferralCode
from brace_backend.services.bonus_service import bonus_service
from brace_backend.services.telegram_notify import notify_user_message


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


class ReferralService:
    _reason_approved = "approved"
    _reason_rejected_self = "rejected_self_referral"
    _reason_rejected_payment = "rejected_payment_fingerprint"
    _reason_rejected_min_amount = "rejected_min_amount"
    _reason_rejected_zero = "rejected_bonus_zero"
    async def get_or_create_code(self, uow: UnitOfWork, *, user_id: UUID) -> ReferralCode:
        existing = await uow.referral_codes.get_for_owner(user_id)
        if existing:
            return existing

        alphabet = string.ascii_uppercase + string.digits
        for _ in range(8):
            code = "".join(secrets.choice(alphabet) for _ in range(settings.referral_code_length))
            entry = ReferralCode(owner_user_id=user_id, code=code, is_active=True)
            try:
                await uow.referral_codes.add(entry)
                await uow.commit()
                await uow.session.refresh(entry)
                return entry
            except IntegrityError:
                await uow.rollback()
                existing = await uow.referral_codes.get_for_owner(user_id)
                if existing:
                    return existing
                continue
        raise ValidationError("Unable to generate referral code.")

    async def apply_referral_code(
        self, uow: UnitOfWork, *, user_id: UUID, code: str
    ) -> ReferralBinding:
        code_normalized = code.strip().upper()
        ref_code = await uow.referral_codes.get_by_code(code_normalized)
        if not ref_code or not ref_code.is_active:
            raise ValidationError("Referral code is invalid.")
        if ref_code.owner_user_id == user_id:
            raise ValidationError("Self-referral is not allowed.")

        if await uow.orders.has_completed(user_id=user_id):
            raise ValidationError("Referral code can only be applied before first purchase.")

        existing = await uow.referral_bindings.get_for_referee(user_id)
        if existing:
            raise ConflictError("Referral code already applied.")

        binding = ReferralBinding(
            referrer_user_id=ref_code.owner_user_id,
            referee_user_id=user_id,
            code_id=ref_code.id,
            status="pending",
        )
        try:
            await uow.referral_bindings.add(binding)
            await uow.commit()
            await uow.session.refresh(binding)
            return binding
        except IntegrityError:
            await uow.rollback()
            raise ConflictError("Referral code already applied.")

    async def list_invited(self, uow: UnitOfWork, *, user_id: UUID) -> list[ReferralBinding]:
        return await uow.referral_bindings.list_for_referrer(user_id)

    async def on_order_completed(self, uow: UnitOfWork, *, order_id: UUID) -> None:
        order = await uow.orders.get_by_id(order_id=order_id)
        if not order or order.status not in ("delivered", "completed"):
            return

        binding = await uow.referral_bindings.get_pending_for_referee_for_update(order.user_id)
        if not binding:
            return

        if binding.referrer_user_id == order.user_id:
            binding.status = "rejected"
            binding.reason_code = self._reason_rejected_self
            await uow.commit()
            return

        payment_fingerprint = order.payment_fingerprint
        if payment_fingerprint:
            matched = await uow.orders.has_completed_with_payment_fingerprint(
                user_id=binding.referrer_user_id,
                payment_fingerprint=payment_fingerprint,
            )
            if matched:
                binding.status = "rejected"
                binding.reason_code = self._reason_rejected_payment
                await uow.commit()
                return

        bonus_base_minor = order.total_amount_minor_units - (order.bonus_applied_minor_units or 0)
        if bonus_base_minor < settings.referral_min_order_amount_minor_units:
            binding.status = "rejected"
            binding.reason_code = self._reason_rejected_min_amount
            await uow.commit()
            return

        bonus_base_rub = bonus_base_minor // 100  # 1 рубль = 1 балл, без округлений
        bonus_amount = int(bonus_base_rub * settings.referral_bonus_percent)
        if bonus_amount <= 0:
            binding.status = "rejected"
            binding.reason_code = self._reason_rejected_zero
            await uow.commit()
            return

        await bonus_service.credit(
            uow,
            user_id=binding.referrer_user_id,
            order_id=order.id,
            amount=bonus_amount,
            reason="referral_bonus",
            commit=False,
        )
        binding.status = "approved"
        binding.reason_code = self._reason_approved
        binding.order_id = order.id
        binding.approved_at = _utc_now()
        await uow.commit()

        user = await uow.users.get(binding.referrer_user_id)
        if user and user.telegram_id:
            try:
                await notify_user_message(
                    int(user.telegram_id),
                    "Вам начислены бонусы за приглашённого пользователя.",
                )
            except Exception:
                from brace_backend.core.logging import logger

                logger.exception("referral_bonus_notify_failed")


referral_service = ReferralService()

__all__ = ["referral_service", "ReferralService"]
