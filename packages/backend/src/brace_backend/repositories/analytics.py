from __future__ import annotations

from typing import Iterable
from uuid import UUID

from uuid import uuid4

from sqlalchemy import insert, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from brace_backend.domain.analytics import AnalyticsEvent


class AnalyticsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def existing_event_ids(self, event_ids: Iterable[UUID]) -> set[UUID]:
        if not event_ids:
            return set()
        result = await self.session.scalars(
            select(AnalyticsEvent.event_id).where(AnalyticsEvent.event_id.in_(list(event_ids)))
        )
        return set(result.all())

    async def add_events(self, events: list[AnalyticsEvent]) -> int:
        if not events:
            return 0
        unique_events: dict[UUID, AnalyticsEvent] = {event.event_id: event for event in events}
        rows = [
            {
                "id": event.id or uuid4(),
                "event_id": event.event_id,
                "name": event.name,
                "event_version": event.event_version,
                "schema_version": event.schema_version,
                "occurred_at": event.occurred_at,
                "source": event.source,
                "session_id": event.session_id,
                "device_id_hash": event.device_id_hash,
                "anon_id_hash": event.anon_id_hash,
                "user_id_hash": event.user_id_hash,
                "screen": event.screen,
                "properties": event.properties,
                "context": event.context,
                "ip_hash": event.ip_hash,
                "user_agent_hash": event.user_agent_hash,
            }
            for event in unique_events.values()
        ]
        dialect = self.session.bind.dialect.name if self.session.bind else "unknown"
        if dialect == "postgresql":
            stmt = pg_insert(AnalyticsEvent).values(rows)
            stmt = stmt.on_conflict_do_nothing(index_elements=["event_id"])
        elif dialect == "sqlite":
            stmt = insert(AnalyticsEvent).values(rows).prefix_with("OR IGNORE")
        else:
            stmt = insert(AnalyticsEvent).values(rows)
        result = await self.session.execute(stmt)
        return int(result.rowcount or 0)
