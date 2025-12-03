import asyncio
import uuid

from brace_backend.core.money import to_minor_units
from brace_backend.db.session import engine as global_engine
from brace_backend.db.session import session_manager
from brace_backend.domain import (
    Banner,
    Order,
    OrderItem,
    Product,
    ProductMedia,
    ProductVariant,
    User,
)
from brace_backend.domain.base import Base
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
                category="trunks" if idx % 2 else "tees",
                is_new=idx <= 2,
                rating_value=4.8,
                rating_count=1000 + idx * 10,
                tags=["100%_cotton", "comfort"],
                specs=["Cotton 95%", "Elastane 5%", "Machine wash 30C"],
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
            product.gallery = [
                ProductMedia(
                    id=uuid.uuid5(SEED_NAMESPACE, f"brace-essential-{idx}:media:{media_idx}"),
                    url=f"https://cdn.example.com/products/{idx}-{media_idx}.jpg",
                    sort_order=media_idx,
                )
                for media_idx in range(1, 3)
            ]
            products.append(product)
        session.add_all(products)
        await session.commit()


async def seed_banners() -> None:
    async with session_manager.session() as session:
        result = await session.scalars(select(Banner))
        if result.first():
            return
        banners = [
            Banner(
                id=uuid.uuid5(SEED_NAMESPACE, "banner:hero"),
                image_url="https://cdn.example.com/banners/hero.jpg",
                video_url=None,
                is_active=True,
                sort_order=0,
            ),
            Banner(
                id=uuid.uuid5(SEED_NAMESPACE, "banner:hero2"),
                image_url="https://cdn.example.com/banners/secondary.jpg",
                video_url=None,
                is_active=True,
                sort_order=1,
            ),
        ]
        session.add_all(banners)
        await session.commit()


async def seed_user_and_orders() -> None:
    async with session_manager.session() as session:
        user = await session.get(User, uuid.uuid5(SEED_NAMESPACE, "user:demo"))
        if not user:
            user = User(
                id=uuid.uuid5(SEED_NAMESPACE, "user:demo"),
                telegram_id=999000,
                first_name="Demo",
                username="demo_user",
            )
            session.add(user)
            await session.flush()

        product = await session.scalar(select(Product).limit(1))
        if not product:
            await session.commit()
            return

        order_exists = await session.scalar(select(Order).where(Order.user_id == user.id))
        if order_exists:
            await session.commit()
            return

        order = Order(user_id=user.id, status="completed", total_amount_minor_units=to_minor_units(59.99))
        session.add(order)
        await session.flush()

        variant = product.variants[0]
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            size=variant.size,
            quantity=1,
            unit_price_minor_units=variant.price_minor_units,
        )
        session.add(order_item)
        await session.commit()


async def seed_all() -> None:
    async with global_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_products()
    await seed_banners()
    await seed_user_and_orders()


if __name__ == "__main__":
    asyncio.run(seed_all())
