"""add approved_at to referral_binding

Revision ID: 202602090001
Revises: 202602080001
Create Date: 2026-02-09 00:30:00
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "202602090001"
down_revision = "202602080001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("referral_binding") as batch:
        batch.add_column(sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("referral_binding") as batch:
        batch.drop_column("approved_at")
