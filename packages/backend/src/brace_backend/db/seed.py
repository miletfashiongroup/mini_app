from __future__ import annotations

import logging
import os
import uuid

from sqlalchemy import func, select
from sqlalchemy.engine import Engine, create_engine
from sqlalchemy.orm import Session

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn
from brace_backend.core.money import to_minor_units
from brace_backend.domain.product import Product, ProductVariant

LOG = logging.getLogger("brace_backend.db.seed")


def _engine() -> Engine:
    """Return a synchronous engine suitable for seeding."""
    seed_url = os.getenv("SEED_DATABASE_URL", settings.database_url)
    return create_engine(ensure_sync_dsn(seed_url))


def _needs_seeding(session: Session) -> bool:
    total = session.scalar(select(func.count()).select_from(Product))
    return not total

SEED_NAMESPACE = uuid.UUID("cb4290f9-9882-4a9d-9c82-2d19a7af8e0d")  # PRINCIPAL-FIX: deterministic ids


def _seed_products(session: Session) -> None:
    catalog = [
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
            price_minor_units=to_minor_units(price),
            stock=stock,
        )
        product.variants.append(variant)
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
