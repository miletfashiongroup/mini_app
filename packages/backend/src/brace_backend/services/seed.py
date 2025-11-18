import asyncio
import uuid

from brace_backend.db.session import session_manager
from brace_backend.domain import Product, ProductVariant
from brace_backend.core.money import to_minor_units
from sqlalchemy import select

SEED_NAMESPACE = uuid.UUID("ac4d53b1-d996-4d06-9c90-25f6a16aaf7f")  # PRINCIPAL-FIX: deterministic ids


async def seed_products() -> None:
    async with session_manager.session() as session:
        result = await session.scalars(select(Product))
        if result.first():
            return

        products: list[Product] = []
        for idx in range(1, 7):
            product = Product(
                id=uuid.uuid5(SEED_NAMESPACE, f"brace-essential-{idx}"),
                name=f"BRACE Essential {idx}",
                description="Premium cotton boxer briefs with adaptive fit.",
                hero_media_url=f"https://cdn.example.com/products/{idx}.jpg",
            )
            product.variants = [
                ProductVariant(
                    id=uuid.uuid5(SEED_NAMESPACE, f"brace-essential-{idx}:{size}"),
                    size=size,
                    price_minor_units=to_minor_units(29.99 + idx),
                    stock=100,
                    product_id=product.id,
                )
                for size in ["S", "M", "L", "XL"]
            ]
            products.append(product)
        session.add_all(products)
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed_products())
