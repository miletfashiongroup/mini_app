import asyncio
import uuid

from brace_backend.db.session import session_manager
from brace_backend.domain import Product, ProductVariant
from sqlalchemy import select


async def seed_products() -> None:
    async with session_manager.session() as session:
        result = await session.scalars(select(Product))
        if result.first():
            return

        products: list[Product] = []
        for idx in range(1, 7):
            product = Product(
                id=uuid.uuid4(),
                name=f"BRACE Essential {idx}",
                description="Premium cotton boxer briefs with adaptive fit.",
                hero_media_url=f"https://cdn.example.com/products/{idx}.jpg",
            )
            product.variants = [
                ProductVariant(size=size, price=29.99 + idx, stock=100, product_id=product.id)
                for size in ["S", "M", "L", "XL"]
            ]
            products.append(product)
        session.add_all(products)
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed_products())
