from __future__ import annotations

import uuid

import pytest

from brace_backend.core.exceptions import NotFoundError
from brace_backend.db.uow import UnitOfWork
from brace_backend.services.product_service import product_service

pytestmark = pytest.mark.asyncio


async def _seed_products(session, product_factory, product_variant_factory, count: int) -> None:
    """Persist a deterministic number of products with single variants each."""
    for _ in range(count):
        product = product_factory()
        product.variants.append(product_variant_factory(product=product))
        session.add(product)
    await session.flush()


async def test_list_products_paginated(session, product_factory, product_variant_factory):
    """Pagination should cap the number of returned products and expose full totals."""
    await _seed_products(session, product_factory, product_variant_factory, 3)

    uow = UnitOfWork(session)
    items, total = await product_service.list_products(uow, page=1, page_size=2)

    assert len(items) == 2
    assert total == 3


async def test_list_products_unpaged(session, product_factory, product_variant_factory):
    """Passing None for pagination arguments should return every record."""
    await _seed_products(session, product_factory, product_variant_factory, 1)

    uow = UnitOfWork(session)
    items, total = await product_service.list_products(uow, page=None, page_size=None)

    assert len(items) == 1
    assert total == 1


async def test_list_products_empty_returns_zero(session):
    """Empty catalog should produce zero totals and an empty list."""
    uow = UnitOfWork(session)
    items, total = await product_service.list_products(uow, page=1, page_size=10)

    assert items == []
    assert total == 0


async def test_get_product_not_found(session):
    """Looking up a missing product ID should raise NotFoundError."""
    uow = UnitOfWork(session)
    with pytest.raises(NotFoundError):
        await product_service.get_product(uow, uuid.uuid4())
