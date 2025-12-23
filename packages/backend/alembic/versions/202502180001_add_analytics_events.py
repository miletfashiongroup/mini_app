"""Add analytics events and daily metrics tables

Revision ID: 202502180001
Revises: 202502080003
Create Date: 2025-02-18 12:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "202502180001"
down_revision = "202502080003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analytics_events",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("event_id", sa.Uuid(), nullable=False, unique=True),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("event_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("schema_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source", sa.String(length=16), nullable=False, server_default="client"),
        sa.Column("session_id", sa.String(length=64), nullable=True),
        sa.Column("device_id_hash", sa.String(length=64), nullable=True),
        sa.Column("anon_id_hash", sa.String(length=64), nullable=True),
        sa.Column("user_id_hash", sa.String(length=64), nullable=True),
        sa.Column("screen", sa.String(length=128), nullable=True),
        sa.Column("properties", sa.JSON(), nullable=True),
        sa.Column("context", sa.JSON(), nullable=True),
        sa.Column("ip_hash", sa.String(length=64), nullable=True),
        sa.Column("user_agent_hash", sa.String(length=64), nullable=True),
    )
    op.create_index("ix_analytics_events_name", "analytics_events", ["name"])
    op.create_index("ix_analytics_events_occurred_at", "analytics_events", ["occurred_at"])
    op.create_index("ix_analytics_events_session_id", "analytics_events", ["session_id"])
    op.create_index("ix_analytics_events_user_id_hash", "analytics_events", ["user_id_hash"])

    op.create_table(
        "analytics_daily_metrics",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("metric_date", sa.Date(), nullable=False),
        sa.Column("metric_key", sa.String(length=64), nullable=False),
        sa.Column("metric_value", sa.Float(), nullable=False),
        sa.Column("dimensions", sa.JSON(), nullable=True),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_analytics_daily_metrics_metric_date", "analytics_daily_metrics", ["metric_date"])
    op.create_index("ix_analytics_daily_metrics_metric_key", "analytics_daily_metrics", ["metric_key"])


def downgrade() -> None:
    op.drop_index("ix_analytics_daily_metrics_metric_key", table_name="analytics_daily_metrics")
    op.drop_index("ix_analytics_daily_metrics_metric_date", table_name="analytics_daily_metrics")
    op.drop_table("analytics_daily_metrics")
    op.drop_index("ix_analytics_events_user_id_hash", table_name="analytics_events")
    op.drop_index("ix_analytics_events_session_id", table_name="analytics_events")
    op.drop_index("ix_analytics_events_occurred_at", table_name="analytics_events")
    op.drop_index("ix_analytics_events_name", table_name="analytics_events")
    op.drop_table("analytics_events")
