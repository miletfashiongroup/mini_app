from __future__ import annotations

from uuid import UUID

from brace_backend.core.exceptions import NotFoundError, ValidationError
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.product import Product
from brace_backend.schemas.products import ProductRead


class ProductService:
    async def list_products(
        self,
        uow: UnitOfWork,
        *,
        page: int | None,
        page_size: int | None,
        category: str | None = None,
    ) -> tuple[list[ProductRead], int]:
        products, total = await uow.products.list_products(
            page=page, page_size=page_size, category=category
        )
        rating_stats = await uow.reviews.list_product_rating_stats([product.id for product in products])
        return [
            self._to_schema(
                product,
                rating_value_override=rating_stats.get(product.id, (product.rating_value, product.rating_count))[0],
                rating_count_override=rating_stats.get(product.id, (product.rating_value, product.rating_count))[1],
            )
            for product in products
        ], total

    async def get_product(self, uow: UnitOfWork, product_id: UUID) -> ProductRead:
        product = await uow.products.get_with_variants(product_id)
        if not product:
            raise NotFoundError("Product not found.")
        rating_stats = await uow.reviews.list_product_rating_stats([product.id])
        rating_value, rating_count = rating_stats.get(product.id, (product.rating_value, product.rating_count))
        return self._to_schema(
            product,
            rating_value_override=rating_value,
            rating_count_override=rating_count,
        )

    async def list_related(self, uow: UnitOfWork, product_id: UUID, limit: int = 4) -> list[ProductRead]:
        products = await uow.products.list_related(product_id=product_id, limit=limit)
        rating_stats = await uow.reviews.list_product_rating_stats([product.id for product in products])
        return [
            self._to_schema(
                product,
                rating_value_override=rating_stats.get(product.id, (product.rating_value, product.rating_count))[0],
                rating_count_override=rating_stats.get(product.id, (product.rating_value, product.rating_count))[1],
            )
            for product in products
        ]

    def _to_schema(
        self,
        product: Product,
        *,
        rating_value_override: float | None = None,
        rating_count_override: int | None = None,
    ) -> ProductRead:
        for variant in product.variants:
            if variant.active_price_minor_units is None:
                raise ValidationError("Active price is missing for a product variant.")
        return ProductRead(
            id=product.id,
            product_code=product.product_code,
            name=product.name,
            description=product.description,
            hero_media_url=product.hero_media_url,
            category=product.category,
            is_new=product.is_new,
            rating_value=rating_value_override if rating_value_override is not None else product.rating_value,
            rating_count=rating_count_override if rating_count_override is not None else product.rating_count,
            tags=product.tags or [],
            gallery=[media.url for media in product.gallery] if product.gallery else [],
            specs=product.specs or [],
            created_at=product.created_at,
            updated_at=product.updated_at,
            variants=[
                {
                    "id": variant.id,
                    "size": variant.size,
                    "price_minor_units": variant.active_price_minor_units,
                    "stock": variant.stock,
                }
                for variant in product.variants
            ],
        )


product_service = ProductService()

__all__ = ["product_service", "ProductService"]
