from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import psycopg

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn

BACKUP_PATH = Path("/tmp/review_backup.json")


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except Exception:
        return None


def main() -> None:
    payload = json.loads(BACKUP_PATH.read_text(encoding="utf-8"))
    product_id = payload["product_id"]
    reviews = payload.get("product_reviews", [])
    media = payload.get("product_review_media", [])
    votes = payload.get("product_review_votes", [])

    dsn = ensure_sync_dsn(settings.database_url)
    if dsn.startswith("postgresql+psycopg://"):
        dsn = dsn.replace("postgresql+psycopg://", "postgresql://", 1)

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM product_reviews WHERE product_id = %s",
                (product_id,),
            )
            for r in reviews:
                cur.execute(
                    """
                    INSERT INTO product_reviews (
                        id, product_id, order_item_id, user_id,
                        external_review_id, external_user_id, external_order_ref,
                        rating, text, is_anonymous, status, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        r.get("id"),
                        r.get("product_id"),
                        r.get("order_item_id"),
                        r.get("user_id"),
                        r.get("external_review_id"),
                        r.get("external_user_id"),
                        r.get("external_order_ref"),
                        r.get("rating"),
                        r.get("text"),
                        r.get("is_anonymous"),
                        r.get("status"),
                        parse_dt(r.get("created_at")) or r.get("created_at"),
                        parse_dt(r.get("updated_at")) or r.get("updated_at"),
                    ),
                )
            for m in media:
                cur.execute(
                    """
                    INSERT INTO product_review_media (
                        id, review_id, url, sort_order, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        m.get("id"),
                        m.get("review_id"),
                        m.get("url"),
                        m.get("sort_order"),
                        parse_dt(m.get("created_at")) or m.get("created_at"),
                        parse_dt(m.get("updated_at")) or m.get("updated_at"),
                    ),
                )
            for v in votes:
                cur.execute(
                    """
                    INSERT INTO product_review_votes (
                        id, review_id, user_id, external_user_id, vote, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        v.get("id"),
                        v.get("review_id"),
                        v.get("user_id"),
                        v.get("external_user_id"),
                        v.get("vote"),
                        parse_dt(v.get("created_at")) or v.get("created_at"),
                        parse_dt(v.get("updated_at")) or v.get("updated_at"),
                    ),
                )

    print("restore ok")


if __name__ == "__main__":
    main()
