"""add product_code to products

Revision ID: 202502250001
Revises: 202502180002
Create Date: 2025-02-25
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "202502250001"
down_revision = "202502180002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("product_code", sa.String(length=64), nullable=True))
    op.create_unique_constraint(
        "uq_products_product_code", "products", ["product_code"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_products_product_code", "products", type_="unique")
    op.drop_column("products", "product_code")
