"""add order forum_thread_id

Revision ID: 202602080001
Revises: 202602060001
Create Date: 2026-02-08 23:25:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "202602080001"
down_revision = "202602060001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("orders") as batch:
        batch.add_column(sa.Column("forum_thread_id", sa.BigInteger(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("orders") as batch:
        batch.drop_column("forum_thread_id")
