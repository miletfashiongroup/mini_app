from __future__ import annotations

from uuid import UUID

from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.audit import AuditLog


class AuditService:
    async def log(
        self,
        uow: UnitOfWork,
        *,
        action: str,
        entity_type: str,
        entity_id: str,
        metadata: dict | None = None,
        actor_user_id: UUID | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            meta=metadata,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        await uow.audits.add(entry)
        await uow.flush()
        return entry


audit_service = AuditService()

__all__ = ["audit_service", "AuditService"]
