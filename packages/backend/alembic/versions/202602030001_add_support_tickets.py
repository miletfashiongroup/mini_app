"""add support tickets table

Revision ID: 202602030001
Revises: 202502250003
Create Date: 2026-02-03 00:00:00
"""

from __future__ import annotations

import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg
from alembic import op

revision = "202602030001"
down_revision = "202502250003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "support_tickets",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "user_id",
            pg.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "order_id",
            pg.UUID(as_uuid=True),
            sa.ForeignKey("orders.id", ondelete="SET NULL"),
        ),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="open"),
        sa.Column("priority", sa.String(length=16), nullable=False, server_default="normal"),
        sa.Column("subject", sa.String(length=128), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("manager_comment", sa.Text()),
        sa.Column(
            "manager_user_id",
            pg.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("meta", sa.JSON(), nullable=True),
    )
    op.create_index("ix_support_tickets_user_id", "support_tickets", ["user_id"])
    op.create_index("ix_support_tickets_order_id", "support_tickets", ["order_id"])


def downgrade() -> None:
    op.drop_index("ix_support_tickets_order_id", table_name="support_tickets")
    op.drop_index("ix_support_tickets_user_id", table_name="support_tickets")
    op.drop_table("support_tickets")
