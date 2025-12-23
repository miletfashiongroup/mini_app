"""Add analytics report history and indexes

Revision ID: 202502180002
Revises: 202502180001
Create Date: 2025-02-18 13:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "202502180002"
down_revision = "202502180001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_analytics_events_name_occurred_at",
        "analytics_events",
        ["name", "occurred_at"],
    )
    op.create_index(
        "ix_analytics_events_session_occurred_at",
        "analytics_events",
        ["session_id", "occurred_at"],
    )
    op.create_index(
        "ix_analytics_events_anon_id_hash",
        "analytics_events",
        ["anon_id_hash"],
    )
    op.create_index(
        "ix_analytics_events_product_id",
        "analytics_events",
        [sa.text("(properties->>'product_id')")],
        postgresql_using="btree",
    )
    op.create_index(
        "ix_analytics_daily_metrics_unique",
        "analytics_daily_metrics",
        ["metric_date", "metric_key"],
        unique=False,
    )

    op.create_table(
        "analytics_reports",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("report_date", sa.Date(), nullable=False),
        sa.Column("report_type", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="pending"),
        sa.Column("content", sa.String(length=4096), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_analytics_reports_report_date", "analytics_reports", ["report_date"])
    op.create_index("ix_analytics_reports_report_type", "analytics_reports", ["report_type"])


def downgrade() -> None:
    op.drop_index("ix_analytics_reports_report_type", table_name="analytics_reports")
    op.drop_index("ix_analytics_reports_report_date", table_name="analytics_reports")
    op.drop_table("analytics_reports")
    op.drop_index("ix_analytics_daily_metrics_unique", table_name="analytics_daily_metrics")
    op.drop_index("ix_analytics_events_anon_id_hash", table_name="analytics_events")
    op.drop_index("ix_analytics_events_product_id", table_name="analytics_events")
    op.drop_index("ix_analytics_events_session_occurred_at", table_name="analytics_events")
    op.drop_index("ix_analytics_events_name_occurred_at", table_name="analytics_events")
