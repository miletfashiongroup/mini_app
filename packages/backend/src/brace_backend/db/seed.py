from __future__ import annotations

import logging
import os
import time
import uuid

from sqlalchemy import func, select, text
from sqlalchemy.engine import Engine, create_engine, make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn
from brace_backend.core.money import to_minor_units
from datetime import datetime, timezone

from brace_backend.domain.product import Product, ProductPrice, ProductVariant

LOG = logging.getLogger("brace_backend.db.seed")


def _resolve_seed_url() -> str:
    override = os.getenv("SEED_DATABASE_URL")
    if override:
        return ensure_sync_dsn(override)
    return settings.sync_database_url


def _validate_seed_url(url: str) -> str:
    parsed = make_url(url)
    if not parsed.host:
        raise ValueError(
            f"Seed database URL is missing host information: {url}. "
            "Set BRACE_DATABASE_URL/DATABASE_URL to your Render Postgres DSN."
        )
    return url


def _engine() -> Engine:
    """Return a synchronous engine suitable for seeding."""
    retries = int(os.getenv("SEED_DB_MAX_RETRIES", "10"))
    interval = int(os.getenv("SEED_DB_RETRY_INTERVAL", "3"))
    attempt = 1
    seed_url = _validate_seed_url(_resolve_seed_url())
    LOG.info("Seed using database URL: %s", seed_url)

    while True:
        try:
            engine = create_engine(seed_url, future=True)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        except SQLAlchemyError as exc:
            LOG.warning(
                "Seed database connection failed; retrying (attempt %d/%d): %s",
                attempt,
                retries,
                exc,
            )
            if attempt >= retries:
                raise
            attempt += 1
            time.sleep(interval)
        else:
            return engine


def _needs_seeding(session: Session) -> bool:
    total = session.scalar(select(func.count()).select_from(Product))
    return not total

SEED_NAMESPACE = uuid.UUID("cb4290f9-9882-4a9d-9c82-2d19a7af8e0d")  # PRINCIPAL-FIX: deterministic ids


def _seed_products(session: Session) -> None:
    catalog = [
        # TODO (MANUAL):
        # Здесь необходимо вручную добавить:
        # - URL изображения карточки товара (S3 / CDN / reg.ru storage) в hero_media_url
        # - Видео-обзор (опционально) в product_media
        # - Тексты описаний (description/specs)
        # - Цены с периодами в product_prices при обновлениях
        ("Smoke Tee", "Classic tee for smoke tests", "39.99", "M", 50),
        ("Smoke Hoodie", "Cozy hoodie for testing", "59.99", "L", 25),
        ("Smoke Joggers", "Comfort joggers", "45.00", "S", 10),
    ]
    for name, description, price, size, stock in catalog:
        product_id = uuid.uuid5(SEED_NAMESPACE, name)
        variant_id = uuid.uuid5(SEED_NAMESPACE, f"{name}:{size}")
        product = Product(id=product_id, name=name, description=description, hero_media_url=None)
        variant = ProductVariant(
            id=variant_id,
            product_id=product_id,
            size=size,
            stock=stock,
        )
        price_row = ProductPrice(
            product_variant_id=variant_id,
            price_minor_units=to_minor_units(price),
            currency_code="RUB",
            starts_at=datetime.now(tz=timezone.utc),
        )
        product.variants.append(variant)
        variant.prices.append(price_row)
        session.add(product)
    session.commit()
    LOG.info("Seeded %s products for smoke tests.", len(catalog))  # PRINCIPAL-FIX: deterministic seed data


def run_seed() -> None:
    logging.basicConfig(level=logging.INFO)
    engine = _engine()
    with Session(engine) as session:
        if _needs_seeding(session):
            _seed_products(session)
        else:
            LOG.info("Products already present; skipping seed.")


if __name__ == "__main__":
    run_seed()
