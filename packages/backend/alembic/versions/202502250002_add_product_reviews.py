"""add product reviews tables

Revision ID: 202502250002
Revises: 202502250001
Create Date: 2025-02-25 00:02:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "202502250002"
down_revision = "202502250001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "product_reviews",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("product_id", sa.UUID(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_item_id", sa.UUID(), sa.ForeignKey("order_items.id"), nullable=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("external_review_id", sa.String(64), nullable=True),
        sa.Column("external_user_id", sa.String(64), nullable=True),
        sa.Column("external_order_ref", sa.String(64), nullable=True),
        sa.Column("rating", sa.SmallInteger(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("status", sa.String(32), nullable=False, server_default=sa.text("'published'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating_range"),
    )
    op.create_index("ix_product_reviews_product_id", "product_reviews", ["product_id"])
    op.create_index("ix_product_reviews_user_id", "product_reviews", ["user_id"])
    op.create_index("ix_product_reviews_external_review_id", "product_reviews", ["external_review_id"], unique=True)

    op.create_table(
        "product_review_media",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("review_id", sa.UUID(), sa.ForeignKey("product_reviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_review_media_review_id", "product_review_media", ["review_id"])

    op.create_table(
        "product_review_votes",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("review_id", sa.UUID(), sa.ForeignKey("product_reviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("external_user_id", sa.String(64), nullable=True),
        sa.Column("vote", sa.SmallInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("vote IN (-1, 1)", name="ck_review_vote_value"),
        sa.UniqueConstraint("review_id", "user_id", name="uq_review_vote_user"),
        sa.UniqueConstraint("review_id", "external_user_id", name="uq_review_vote_external_user"),
    )
    op.create_index("ix_review_votes_review_id", "product_review_votes", ["review_id"])


def downgrade() -> None:
    op.drop_index("ix_review_votes_review_id", table_name="product_review_votes")
    op.drop_table("product_review_votes")

    op.drop_index("ix_review_media_review_id", table_name="product_review_media")
    op.drop_table("product_review_media")

    op.drop_index("ix_product_reviews_external_review_id", table_name="product_reviews")
    op.drop_index("ix_product_reviews_user_id", table_name="product_reviews")
    op.drop_index("ix_product_reviews_product_id", table_name="product_reviews")
    op.drop_table("product_reviews")
