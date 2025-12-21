"""user profile fields, consent tracking, and demographics"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202502080001"
down_revision: str | None = "202501010001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("full_name", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(length=32), nullable=True))
    op.add_column("users", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("birth_date", sa.Date(), nullable=True))
    op.add_column("users", sa.Column("gender", sa.String(length=10), nullable=True))
    op.add_column("users", sa.Column("consent_given_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("consent_text", sa.String(length=512), nullable=True))
    op.add_column("users", sa.Column("consent_ip", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("consent_user_agent", sa.String(length=512), nullable=True))
    op.add_column("users", sa.Column("profile_completed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_check_constraint("ck_users_gender_valid", "users", "gender in ('male','female')")
    op.create_index("ix_users_gender", "users", ["gender"])
    op.create_index("ix_users_birth_date", "users", ["birth_date"])
    op.create_index("ix_users_profile_completed_at", "users", ["profile_completed_at"])


def downgrade() -> None:
    op.drop_index("ix_users_profile_completed_at", table_name="users")
    op.drop_index("ix_users_birth_date", table_name="users")
    op.drop_index("ix_users_gender", table_name="users")
    op.drop_constraint("ck_users_gender_valid", "users", type_="check")
    op.drop_column("users", "profile_completed_at")
    op.drop_column("users", "consent_user_agent")
    op.drop_column("users", "consent_ip")
    op.drop_column("users", "consent_text")
    op.drop_column("users", "consent_given_at")
    op.drop_column("users", "gender")
    op.drop_column("users", "birth_date")
    op.drop_column("users", "email")
    op.drop_column("users", "phone")
    op.drop_column("users", "full_name")
