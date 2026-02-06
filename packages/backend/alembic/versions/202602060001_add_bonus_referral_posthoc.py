"""backfill bonus/referral/favorites schema

Revision ID: 202602060001
Revises: 202602030002
Create Date: 2026-02-06 00:01:00
"""
from __future__ import annotations

from alembic import op

revision = "202602060001"
down_revision = "202602030002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Orders extras
    op.execute(
        """
        ALTER TABLE orders
          ADD COLUMN IF NOT EXISTS bonus_applied_minor_units BIGINT NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS payment_fingerprint VARCHAR(128);
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'ck_order_bonus_nonnegative'
          ) THEN
            ALTER TABLE orders ADD CONSTRAINT ck_order_bonus_nonnegative CHECK (bonus_applied_minor_units >= 0);
          END IF;
        END$$;
        """
    )
    op.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS meta JSONB;")
    op.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_notified_status VARCHAR(50);")

    # Favorite items
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS favorite_items (
          id UUID PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
          size VARCHAR NOT NULL,
          CONSTRAINT uniq_favorite_item_variant UNIQUE (user_id, variant_id)
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_favorite_items_user_id ON favorite_items(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_favorite_items_product_id ON favorite_items(product_id);")

    # Bonus ledger
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS bonus_ledger (
          id UUID PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
          entry_type VARCHAR(16) NOT NULL,
          amount BIGINT NOT NULL,
          reason VARCHAR(32) NOT NULL,
          expires_at TIMESTAMPTZ,
          related_entry_id UUID REFERENCES bonus_ledger(id),
          meta JSONB,
          CONSTRAINT ck_bonus_amount_positive CHECK (amount > 0),
          CONSTRAINT ck_bonus_entry_type CHECK (entry_type IN ('credit','debit','expire','reversal'))
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_bonus_ledger_user_id ON bonus_ledger(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_bonus_ledger_order_id ON bonus_ledger(order_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_bonus_ledger_expires_at ON bonus_ledger(expires_at);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_bonus_ledger_user_created ON bonus_ledger(user_id, created_at);")

    # Referral code / binding
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS referral_code (
          id UUID PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          code VARCHAR(16) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          CONSTRAINT uniq_referral_code_owner UNIQUE (owner_user_id),
          CONSTRAINT uniq_referral_code_value UNIQUE (code)
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS referral_binding (
          id UUID PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          referee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          code_id UUID NOT NULL REFERENCES referral_code(id) ON DELETE CASCADE,
          status VARCHAR(16) NOT NULL,
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          reason_code VARCHAR(32),
          CONSTRAINT uniq_referral_referee UNIQUE (referee_user_id)
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_referral_binding_referrer ON referral_binding(referrer_user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_referral_binding_status_created ON referral_binding(status, created_at);")
    op.execute(
        """
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'ck_referral_binding_reason'
          ) THEN
            ALTER TABLE referral_binding
              ADD CONSTRAINT ck_referral_binding_reason
              CHECK (reason_code IS NULL OR reason_code IN (
                'approved',
                'rejected_self_referral',
                'rejected_payment_fingerprint',
                'rejected_min_amount',
                'rejected_bonus_zero'
              ));
          END IF;
        END$$;
        """
    )

    # Support ticket index (table name plural in prod)
    op.execute("CREATE INDEX IF NOT EXISTS ix_support_tickets_status_created ON support_tickets(status, created_at);")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_support_tickets_status_created;")
    op.execute("DROP INDEX IF EXISTS ix_referral_binding_status_created;")
    op.execute("DROP INDEX IF EXISTS ix_referral_binding_referrer;")
    op.execute("DROP TABLE IF EXISTS referral_binding CASCADE;")
    op.execute("DROP TABLE IF EXISTS referral_code CASCADE;")

    op.execute("DROP INDEX IF EXISTS ix_bonus_ledger_user_created;")
    op.execute("DROP INDEX IF EXISTS ix_bonus_ledger_expires_at;")
    op.execute("DROP INDEX IF EXISTS ix_bonus_ledger_order_id;")
    op.execute("DROP INDEX IF EXISTS ix_bonus_ledger_user_id;")
    op.execute("DROP TABLE IF EXISTS bonus_ledger CASCADE;")

    op.execute("DROP INDEX IF EXISTS ix_favorite_items_product_id;")
    op.execute("DROP INDEX IF EXISTS ix_favorite_items_user_id;")
    op.execute("DROP TABLE IF EXISTS favorite_items CASCADE;")

    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS last_notified_status;")
    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS meta;")
    op.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS ck_order_bonus_nonnegative;")
    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS payment_fingerprint;")
    op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS bonus_applied_minor_units;")
