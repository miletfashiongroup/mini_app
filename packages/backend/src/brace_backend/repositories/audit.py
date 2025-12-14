from __future__ import annotations

from brace_backend.domain.audit import AuditLog
from brace_backend.repositories.base import SQLAlchemyRepository


class AuditRepository(SQLAlchemyRepository[AuditLog]):
    model = AuditLog


__all__ = ["AuditRepository"]
