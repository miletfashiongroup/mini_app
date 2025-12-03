"""Expand product fields, cart variant tracking, and product media

Revision ID: 202411210001
Revises: 202411180001_merge_heads
Create Date: 2024-11-21
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = "202411210001"
down_revision = "202411180001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    dialect = op.get_bind().dialect.name
    uuid_type = postgresql.UUID(as_uuid=True) if dialect == "postgresql" else sa.String(length=36)
    array_type = (
        postgresql.ARRAY(sa.String())
        if dialect == "postgresql"
        else sa.JSON()
    )

    op.add_column("products", sa.Column("category", sa.String(length=50), nullable=True))
    op.add_column(
        "products",
        sa.Column("is_new", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column(
        "products",
        sa.Column("rating_value", sa.Float(), server_default=sa.text("0"), nullable=False),
    )
    op.add_column(
        "products",
        sa.Column("rating_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
    )
    op.add_column(
        "products",
        sa.Column(
            "tags",
            array_type,
            server_default=sa.text("'{}'") if dialect == "postgresql" else sa.text("'[]'"),
            nullable=False,
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "specs",
            array_type,
            server_default=sa.text("'{}'") if dialect == "postgresql" else sa.text("'[]'"),
            nullable=False,
        ),
    )
    op.create_index("ix_products_category_created", "products", ["category", "created_at"])

    op.create_table(
        "product_media",
        sa.Column("id", uuid_type, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("product_id", uuid_type, nullable=False),
        sa.Column("url", sa.String(length=512), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name="fk_product_media_product_id_products",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.add_column(
        "cart_items",
        sa.Column("variant_id", uuid_type, nullable=True),
    )
    if dialect == "sqlite":
        with op.batch_alter_table("cart_items") as batch_op:
            batch_op.drop_constraint("uniq_cart_item", type_="unique")
            batch_op.create_unique_constraint(
                "uniq_cart_item_variant", ["user_id", "variant_id"]
            )
            batch_op.create_foreign_key(
                "fk_cart_items_variant",
                "product_variants",
                ["variant_id"],
                ["id"],
                ondelete="CASCADE",
            )
            batch_op.create_index("ix_cart_items_user", ["user_id"])
            batch_op.create_index("ix_cart_items_variant", ["variant_id"])
    else:
        op.drop_constraint("uniq_cart_item", "cart_items", type_="unique")
        op.create_unique_constraint(
            "uniq_cart_item_variant", "cart_items", ["user_id", "variant_id"]
        )
        op.create_foreign_key(
            "fk_cart_items_variant",
            "cart_items",
            "product_variants",
            ["variant_id"],
            ["id"],
            ondelete="CASCADE",
        )
        op.create_index("ix_cart_items_user", "cart_items", ["user_id"])
        op.create_index("ix_cart_items_variant", "cart_items", ["variant_id"])
    op.create_index("ix_orders_user_created", "orders", ["user_id", "created_at"])
    # Backfill variant_id where possible
    if dialect == "sqlite":
        op.execute(
            """
            UPDATE cart_items
            SET variant_id = (
                SELECT pv.id FROM product_variants pv
                WHERE pv.product_id = cart_items.product_id AND pv.size = cart_items.size
                LIMIT 1
            )
            """
        )
    else:
        op.execute(
            """
            UPDATE cart_items ci
            SET variant_id = pv.id
            FROM product_variants pv
            WHERE pv.product_id = ci.product_id AND pv.size = ci.size
            """
        )
    if dialect == "sqlite":
        with op.batch_alter_table("cart_items") as batch_op:
            batch_op.alter_column("variant_id", nullable=False, existing_type=uuid_type)
    else:
        op.alter_column("cart_items", "variant_id", nullable=False)


def downgrade() -> None:
    dialect = op.get_bind().dialect.name
    if dialect == "sqlite":
        with op.batch_alter_table("cart_items") as batch_op:
            batch_op.alter_column("variant_id", nullable=True)
            batch_op.drop_constraint("fk_cart_items_variant", type_="foreignkey")
            batch_op.drop_constraint("uniq_cart_item_variant", type_="unique")
            batch_op.create_unique_constraint(
                "uniq_cart_item", ["user_id", "product_id", "size"]
            )
            batch_op.drop_column("variant_id")
    else:
        op.alter_column("cart_items", "variant_id", nullable=True)
        op.drop_constraint("fk_cart_items_variant", "cart_items", type_="foreignkey")
        op.drop_constraint("uniq_cart_item_variant", "cart_items", type_="unique")
        op.create_unique_constraint(
            "uniq_cart_item", "cart_items", ["user_id", "product_id", "size"]
        )
        op.drop_column("cart_items", "variant_id")

    op.drop_table("product_media")
    op.drop_column("products", "specs")
    op.drop_column("products", "tags")
    op.drop_column("products", "rating_count")
    op.drop_column("products", "rating_value")
    op.drop_column("products", "is_new")
    op.drop_column("products", "category")
