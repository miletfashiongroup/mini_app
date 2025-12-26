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
        return [self._to_schema(product) for product in products], total

    async def get_product(self, uow: UnitOfWork, product_id: UUID) -> ProductRead:
        product = await uow.products.get_with_variants(product_id)
        if not product:
            raise NotFoundError("Product not found.")
        return self._to_schema(product)

    async def list_related(self, uow: UnitOfWork, product_id: UUID, limit: int = 4) -> list[ProductRead]:
        products = await uow.products.list_related(product_id=product_id, limit=limit)
        return [self._to_schema(product) for product in products]

    def _to_schema(self, product: Product) -> ProductRead:
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
            rating_value=product.rating_value,
            rating_count=product.rating_count,
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
