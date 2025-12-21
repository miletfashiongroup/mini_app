"""add email opt-out flag for onboarding"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202502080002"
down_revision: str | None = "202502080001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("email_opt_out", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("users", "email_opt_out", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "email_opt_out")
