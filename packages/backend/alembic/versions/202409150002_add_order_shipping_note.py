"""add shipping address and note to orders"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202409150002"
down_revision: str | None = "202409010001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("shipping_address", sa.String(length=512), nullable=True))
    op.add_column("orders", sa.Column("note", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "note")
    op.drop_column("orders", "shipping_address")
