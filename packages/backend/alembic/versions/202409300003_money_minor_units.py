"""convert monetary columns to minor units"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202409300003"
down_revision: str | None = "202409150002"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def _upgrade_money_column(table: str, old: str, new: str) -> None:
    op.add_column(
        table,
        sa.Column(new, sa.BigInteger(), nullable=False, server_default="0"),
    )
    op.execute(
        f"UPDATE {table} SET {new} = COALESCE(ROUND({old} * 100), 0)::bigint"
    )
    op.alter_column(table, new, server_default=None)
    op.drop_column(table, old)


def _downgrade_money_column(table: str, old: str, new: str) -> None:
    op.add_column(
        table,
        sa.Column(old, sa.Numeric(10, 2), nullable=False, server_default="0"),
    )
    op.execute(
        f"UPDATE {table} SET {old} = ({new}::numeric / 100)"
    )
    op.alter_column(table, old, server_default=None)
    op.drop_column(table, new)


def upgrade() -> None:
    # PRINCIPAL-NOTE: Money is stored in kopeks to avoid float rounding issues.
    _upgrade_money_column("product_variants", "price", "price_minor_units")
    _upgrade_money_column("cart_items", "unit_price", "unit_price_minor_units")
    _upgrade_money_column("order_items", "unit_price", "unit_price_minor_units")
    _upgrade_money_column("orders", "total_amount", "total_amount_minor_units")


def downgrade() -> None:
    _downgrade_money_column("orders", "total_amount", "total_amount_minor_units")
    _downgrade_money_column("order_items", "unit_price", "unit_price_minor_units")
    _downgrade_money_column("cart_items", "unit_price", "unit_price_minor_units")
    _downgrade_money_column("product_variants", "price", "price_minor_units")
