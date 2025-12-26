from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import psycopg

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn

PRODUCT_ID = "1a9d6a52-910c-4493-8c18-a5fed1a7c38c"
OUT_PATH = Path("/tmp/review_backup.json")

dsn = ensure_sync_dsn(settings.database_url)
if dsn.startswith("postgresql+psycopg://"):
    dsn = dsn.replace("postgresql+psycopg://", "postgresql://", 1)

with psycopg.connect(dsn) as conn:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM product_reviews WHERE product_id = %s ORDER BY created_at",
            (PRODUCT_ID,),
        )
        reviews = [dict(zip([c.name for c in cur.description], row)) for row in cur.fetchall()]
        review_ids = [r["id"] for r in reviews]
        media = []
        votes = []
        if review_ids:
            cur.execute(
                "SELECT * FROM product_review_media WHERE review_id = ANY(%s) ORDER BY sort_order, created_at",
                (review_ids,),
            )
            media = [dict(zip([c.name for c in cur.description], row)) for row in cur.fetchall()]
            cur.execute(
                "SELECT * FROM product_review_votes WHERE review_id = ANY(%s) ORDER BY created_at",
                (review_ids,),
            )
            votes = [dict(zip([c.name for c in cur.description], row)) for row in cur.fetchall()]

payload = {
    "product_id": PRODUCT_ID,
    "exported_at": datetime.utcnow().isoformat(),
    "product_reviews": reviews,
    "product_review_media": media,
    "product_review_votes": votes,
}

OUT_PATH.write_text(json.dumps(payload, default=str, ensure_ascii=False, indent=2), encoding="utf-8")
print(str(OUT_PATH))
