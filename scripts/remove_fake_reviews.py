from __future__ import annotations

import psycopg

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn

PRODUCT_ID = "1a9d6a52-910c-4493-8c18-a5fed1a7c38c"


def main() -> None:
    dsn = ensure_sync_dsn(settings.database_url)
    if dsn.startswith("postgresql+psycopg://"):
        dsn = dsn.replace("postgresql+psycopg://", "postgresql://", 1)

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM product_reviews WHERE product_id = %s AND external_review_id LIKE %s",
                (PRODUCT_ID, "fake-%"),
            )
    print("fake reviews removed")


if __name__ == "__main__":
    main()
