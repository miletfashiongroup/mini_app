"""Price versioning, PII encryption columns, audit logs, soft delete, idempotency."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Sequence

import sqlalchemy as sa
from alembic import op
from cryptography.fernet import Fernet

_PII_PREFIX = "enc::"

revision: str = "202501010001"
down_revision: str | None = "202411210001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _load_cipher() -> Fernet | None:
    key = (os.getenv("BRACE_PII_ENCRYPTION_KEY") or os.getenv("PII_ENCRYPTION_KEY") or "").strip()
    if not key:
        return None
    return Fernet(key.encode())


def _encrypt(value: str | None, cipher: Fernet | None) -> str | None:
    """Mirror runtime encryption format (enc:: prefix) so ORM decrypts correctly."""
    if cipher is None or value is None:
        return value
    token = cipher.encrypt(value.encode("utf-8")).decode("utf-8")
    return f"{_PII_PREFIX}{token}"


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    cipher = _load_cipher()
    if dialect == "postgresql" and cipher is None:
        raise RuntimeError("BRACE_PII_ENCRYPTION_KEY is required to encrypt existing PII.")

    # Enable btree_gist for exclusion constraints (PostgreSQL only).
    if dialect == "postgresql":
        with op.get_context().autocommit_block():
            op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    # Soft delete flags
    for table in ("products", "product_variants", "product_media", "banners"):
        op.add_column(table, sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()))
        op.add_column(table, sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
        if dialect != "sqlite":
            op.alter_column(table, "is_deleted", server_default=None)

    # User role
    op.add_column("users", sa.Column("role", sa.String(length=20), nullable=False, server_default="user"))
    if dialect != "sqlite":
        op.alter_column("users", "role", server_default=None)
    op.create_check_constraint("ck_user_role_valid", "users", "role in ('user','admin')")
    # Encrypt existing PII in-place using application Fernet key
    if cipher:
        users = bind.execute(sa.text("SELECT id, first_name, last_name, username FROM users")).fetchall()
        for row in users:
            bind.execute(
                sa.text(
                    """
                    UPDATE users
                    SET first_name = :first_name,
                        last_name = :last_name,
                        username = :username
                    WHERE id = :id
                    """
                ),
                {
                    "id": row.id,
                    "first_name": _encrypt(row.first_name, cipher),
                    "last_name": _encrypt(row.last_name, cipher),
                    "username": _encrypt(row.username, cipher),
                },
            )

    # Orders idempotency
    op.add_column(
        "orders",
        sa.Column("idempotency_key", sa.String(length=128), nullable=False, server_default=""),
    )
    if dialect != "sqlite":
        op.alter_column("orders", "idempotency_key", server_default=None)
    # Populate existing orders with deterministic key
    orders = bind.execute(sa.text("SELECT id FROM orders")).fetchall()
    for row in orders:
        bind.execute(
            sa.text("UPDATE orders SET idempotency_key = :key WHERE id = :id"),
            {"id": row.id, "key": str(uuid.uuid4())},
        )
    op.create_unique_constraint("uniq_order_idempotency", "orders", ["user_id", "idempotency_key"])
    op.create_check_constraint("ck_order_total_nonnegative", "orders", "total_amount_minor_units >= 0")

    # Cart constraints
    op.create_check_constraint("ck_cart_quantity_positive", "cart_items", "quantity > 0")
    op.create_check_constraint("ck_cart_price_nonnegative", "cart_items", "unit_price_minor_units >= 0")

    # Order item constraints
    op.create_check_constraint("ck_order_item_quantity_positive", "order_items", "quantity > 0")
    op.create_check_constraint(
        "ck_order_item_price_nonnegative", "order_items", "unit_price_minor_units >= 0"
    )

    # Product variants adjustments
    op.create_unique_constraint("uniq_variant_size", "product_variants", ["product_id", "size"])
    op.create_check_constraint("ck_variant_stock_nonnegative", "product_variants", "stock >= 0")

    # Price history table
    op.create_table(
        "product_prices",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("product_variant_id", sa.Uuid(), sa.ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("price_minor_units", sa.BigInteger(), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False, server_default="RUB"),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("product_variant_id", "starts_at", name="uniq_price_variant_start"),
        sa.CheckConstraint("price_minor_units >= 0", name="ck_price_nonnegative"),
        sa.CheckConstraint("(ends_at IS NULL) OR (starts_at < ends_at)", name="ck_price_starts_before_ends"),
    )
    if dialect != "sqlite":
        op.alter_column("product_prices", "currency_code", server_default=None)
    op.create_index(
        "ix_product_prices_variant_window",
        "product_prices",
        ["product_variant_id", "starts_at"],
        unique=False,
    )

    # Migrate existing prices from product_variants into product_prices before dropping column.
    variants = bind.execute(sa.text("SELECT id, price_minor_units FROM product_variants")).fetchall()
    for variant in variants:
        bind.execute(
            sa.text(
                """
                INSERT INTO product_prices (id, created_at, updated_at, product_variant_id, price_minor_units, currency_code, starts_at)
                VALUES (:id, :created_at, :updated_at, :variant_id, :price, 'RUB', :starts_at)
                """
            ),
            {
                "id": uuid.uuid4(),
                "created_at": _now(),
                "updated_at": _now(),
                "variant_id": variant.id,
                "price": variant.price_minor_units,
                "starts_at": _now(),
            },
        )

    # Exclusion constraint to prevent overlapping price windows (PostgreSQL only)
    if dialect == "postgresql":
        op.execute(
            """
            ALTER TABLE product_prices
            ADD CONSTRAINT excl_price_timewindow
            EXCLUDE USING gist (
                product_variant_id WITH =,
                tstzrange(starts_at, coalesce(ends_at, 'infinity'), '[)') WITH &&
            )
            """
        )

    # Drop legacy price column
    with op.batch_alter_table("product_variants") as batch_op:
        batch_op.drop_column("price_minor_units")

    # Audit logs
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("entity_id", sa.String(length=128), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_audit_actor", "audit_logs", ["actor_user_id"])
    op.create_index("ix_audit_entity", "audit_logs", ["entity_id"])


def downgrade() -> None:
    op.drop_index("ix_audit_entity", table_name="audit_logs")
    op.drop_index("ix_audit_actor", table_name="audit_logs")
    op.drop_table("audit_logs")

    op.add_column("product_variants", sa.Column("price_minor_units", sa.BigInteger(), nullable=False, server_default="0"))
    op.drop_index("ix_product_prices_variant_window", table_name="product_prices")
    op.drop_table("product_prices")

    op.drop_constraint("ck_variant_stock_nonnegative", "product_variants", type_="check")
    op.drop_constraint("uniq_variant_size", "product_variants", type_="unique")
    op.drop_constraint("ck_order_item_price_nonnegative", "order_items", type_="check")
    op.drop_constraint("ck_order_item_quantity_positive", "order_items", type_="check")
    op.drop_constraint("ck_cart_price_nonnegative", "cart_items", type_="check")
    op.drop_constraint("ck_cart_quantity_positive", "cart_items", type_="check")

    op.drop_constraint("uniq_order_idempotency", "orders", type_="unique")
    op.drop_constraint("ck_order_total_nonnegative", "orders", type_="check")
    op.drop_column("orders", "idempotency_key")

    op.drop_constraint("ck_user_role_valid", "users", type_="check")
    op.drop_column("users", "role")

    for table in ("products", "product_variants", "product_media", "banners"):
        op.drop_column(table, "deleted_at")
        op.drop_column(table, "is_deleted")
