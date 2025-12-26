from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, timezone

import psycopg

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn

PRODUCT_ID = "1a9d6a52-910c-4493-8c18-a5fed1a7c38c"
FAKE_COUNT = 12

TEXTS = [
    "Очень комфортно, ткань мягкая и приятная.",
    "Качество хорошее, швы ровные, без ниток.",
    "Размер соответствует, сидит отлично.",
    "Плотная ткань, носится хорошо.",
    "Отличный вариант на каждый день.",
    "Приятно удивлен качеством и посадкой.",
    "Все понравилось, буду брать еще.",
    "Материал дышит, комфортно в носке.",
    "Доставка быстрая, товар отличный.",
    "Хорошая посадка, ткань не тянется.",
]

RATING_CHOICES = [3, 4, 5]


def to_uuid(namespace_prefix: str, external_id: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_URL, f"{namespace_prefix}:{external_id}")


def main() -> None:
    dsn = ensure_sync_dsn(settings.database_url)
    if dsn.startswith("postgresql+psycopg://"):
        dsn = dsn.replace("postgresql+psycopg://", "postgresql://", 1)

    now = datetime.now(timezone.utc)

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM product_reviews WHERE product_id = %s AND external_review_id LIKE %s",
                (PRODUCT_ID, "fake-%"),
            )

            for i in range(1, FAKE_COUNT + 1):
                external_id = f"fake-{i}"
                review_id = to_uuid("review", f"{PRODUCT_ID}:{external_id}")
                created_at = now - timedelta(days=random.randint(1, 90))
                updated_at = created_at
                is_anonymous = bool(i % 2)
                rating = random.choice(RATING_CHOICES)
                text = random.choice(TEXTS)
                external_user_id = f"fake-user-{i}"
                external_order_ref = f"fake-order-{i}"

                cur.execute(
                    """
                    INSERT INTO product_reviews (
                        id, product_id, order_item_id, user_id,
                        external_review_id, external_user_id, external_order_ref,
                        rating, text, is_anonymous, status, created_at, updated_at
                    ) VALUES (%s, %s, NULL, NULL, %s, %s, %s, %s, %s, %s, 'published', %s, %s)
                    """,
                    (
                        review_id,
                        PRODUCT_ID,
                        external_id,
                        external_user_id,
                        external_order_ref,
                        rating,
                        text,
                        is_anonymous,
                        created_at,
                        updated_at,
                    ),
                )

                if i % 2 == 0:
                    for idx in range(1, random.randint(2, 3)):
                        media_external = f"fake-media-{i}-{idx}"
                        media_id = to_uuid("review_media", media_external)
                        url = f"https://placehold.co/600x600/png?text=Review+{i}-{idx}"
                        cur.execute(
                            """
                            INSERT INTO product_review_media (
                                id, review_id, url, sort_order, created_at, updated_at
                            ) VALUES (%s, %s, %s, %s, %s, %s)
                            """,
                            (media_id, review_id, url, idx - 1, created_at, created_at),
                        )

                votes = random.randint(1, 3)
                for v in range(1, votes + 1):
                    vote_external = f"fake-vote-{i}-{v}"
                    vote_id = to_uuid("review_vote", vote_external)
                    external_voter = f"fake-voter-{i}-{v}"
                    vote_value = 1 if v % 3 else -1
                    cur.execute(
                        """
                        INSERT INTO product_review_votes (
                            id, review_id, user_id, external_user_id, vote, created_at, updated_at
                        ) VALUES (%s, %s, NULL, %s, %s, %s, %s)
                        """,
                        (vote_id, review_id, external_voter, vote_value, created_at, created_at),
                    )

    print("fake reviews inserted")


if __name__ == "__main__":
    main()
