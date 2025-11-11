from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from brace_backend.api.deps import get_db
from brace_backend.models import Product
from brace_backend.schemas.common import Pagination, Product as ProductSchema

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("")
async def list_products(
    pagination: Pagination = Depends(),
    session: AsyncSession = Depends(get_db),
) -> dict[str, list[ProductSchema]]:
    stmt = (
        select(Product)
        .offset(pagination.offset)
        .limit(pagination.limit)
        .order_by(Product.created_at.desc())
    )
    result = await session.scalars(stmt)
    products = result.unique().all()
    payload = []
    for product in products:
        payload.append(
            ProductSchema(
                id=product.id,
                name=product.name,
                description=product.description,
                hero_media_url=product.hero_media_url,
                created_at=product.created_at,
                updated_at=product.updated_at,
                variants=[
                    {
                        "id": variant.id,
                        "size": variant.size,
                        "price": float(variant.price),
                        "stock": variant.stock,
                    }
                    for variant in product.variants
                ],
            )
        )
    return {"items": payload}


@router.get("/{product_id}")
async def get_product(product_id: UUID, session: AsyncSession = Depends(get_db)) -> ProductSchema:
    stmt = select(Product).where(Product.id == product_id)
    result = await session.scalars(stmt)
    product = result.unique().one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductSchema(
        id=product.id,
        name=product.name,
        description=product.description,
        hero_media_url=product.hero_media_url,
        created_at=product.created_at,
        updated_at=product.updated_at,
        variants=[
            {
                "id": variant.id,
                "size": variant.size,
                "price": float(variant.price),
                "stock": variant.stock,
            }
            for variant in product.variants
        ],
    )
