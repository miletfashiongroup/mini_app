"""add updated_at to review media and votes

Revision ID: 202502250003
Revises: 202502250002
Create Date: 2025-02-25 00:03:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "202502250003"
down_revision = "202502250002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "product_review_media",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.add_column(
        "product_review_votes",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("product_review_votes", "updated_at")
    op.drop_column("product_review_media", "updated_at")
