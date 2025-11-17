from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from brace_backend.repositories import (
    CartRepository,
    OrderRepository,
    ProductRepository,
    UserRepository,
)


@dataclass
class UnitOfWork:
    """Aggregate repositories and control transaction boundaries."""

    session: AsyncSession
    products: ProductRepository = field(init=False, repr=False)
    carts: CartRepository = field(init=False, repr=False)
    orders: OrderRepository = field(init=False, repr=False)
    users: UserRepository = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.products = ProductRepository(self.session)
        self.carts = CartRepository(self.session)
        self.orders = OrderRepository(self.session)
        self.users = UserRepository(self.session)

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()

    async def flush(self) -> None:
        await self.session.flush()

    def __getattr__(self, item: str) -> Any:
        # Delegate attribute access to the underlying session for convenience.
        return getattr(self.session, item)
