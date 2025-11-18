from __future__ import annotations

import asyncio
import json
import os
import secrets
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import quote
from uuid import UUID

import httpx
from brace_backend.core.security import build_signature
from brace_backend.domain.base import Base
from brace_backend.domain.product import Product, ProductVariant
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(
            f"{name} is required for full-stack smoke tests. "
            "Add it to .env, infra/docker-compose.prod.yml, or your deployment secrets."
        )
    return value


def _require_smoke_database_url() -> str:
    url = os.getenv(
        "SMOKE_DATABASE_URL",
        os.getenv(
            "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/brace_smoke"
        ),
    )
    if "brace_smoke" not in url.rsplit("/", 1)[-1]:
        raise RuntimeError(
            "SMOKE_DATABASE_URL must point to a dedicated brace_smoke database to avoid truncating production data."
        )  # PRINCIPAL-FIX
    return url


DATABASE_URL = _require_smoke_database_url()
BACKEND_BASE_URL = os.getenv("SMOKE_BACKEND_URL", "http://localhost:8000")
FRONTEND_BASE_URL = os.getenv("SMOKE_FRONTEND_URL", "http://localhost")
TELEGRAM_BOT_TOKEN = _require_env("BRACE_TELEGRAM_BOT_TOKEN")


@dataclass
class SeededProduct:
    id: UUID
    variant_id: UUID
    size: str
    name: str
    price_minor_units: int
    stock: int


def build_telegram_init_header(user_payload: dict[str, Any]) -> str:
    auth_date = int(time.time())
    payload = {"user": user_payload, "auth_date": auth_date, "nonce": secrets.token_hex(8)}
    signature = build_signature(payload.copy(), secret_token=TELEGRAM_BOT_TOKEN)
    encoded_user = quote(json.dumps(user_payload, separators=(",", ":"), ensure_ascii=False))
    nonce = payload["nonce"]
    return f"auth_date={auth_date}&nonce={nonce}&user={encoded_user}&hash={signature}"


async def reset_database(engine) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        tables = ", ".join(f'"{tbl.name}"' for tbl in Base.metadata.sorted_tables)
        if tables:
            await conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))


async def seed_products(engine) -> list[SeededProduct]:
    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    products: list[SeededProduct] = []
    catalog = [
        ("Smoke Tee", 3999, "M", 50),
        ("Smoke Hoodie", 5999, "L", 25),
        ("Smoke Joggers", 4500, "S", 10),
    ]
    async with session_factory() as session:
        for name, price_minor_units, size, stock in catalog:
            product = Product(name=name, description=f"{name} description", hero_media_url=None)
            variant = ProductVariant(
                product=product, size=size, price_minor_units=price_minor_units, stock=stock
            )
            product.variants.append(variant)
            session.add(product)
            await session.flush()
            products.append(
                SeededProduct(
                    id=product.id,
                    variant_id=variant.id,
                    size=size,
                    name=name,
                    price_minor_units=price_minor_units,
                    stock=stock,
                )
            )
        await session.commit()
    return products


async def wait_for_backend(client: httpx.AsyncClient, timeout: float = 30.0) -> None:
    started = time.time()
    while True:
        try:
            response = await client.get("/api/health", timeout=5.0)
            if response.status_code == 200:
                return
        except httpx.HTTPError:
            pass
        if time.time() - started > timeout:
            raise TimeoutError("Backend health endpoint did not become ready in time.")
        await asyncio.sleep(1)


def assert_envelope(response: httpx.Response, *, status: int = 200) -> dict[str, Any]:
    if response.status_code != status:
        raise AssertionError(f"Expected status {status}, got {response.status_code}: {response.text}")
    payload = response.json()
    assert "data" in payload, "Envelope missing data field"
    assert "error" in payload, "Envelope missing error field"
    pagination = payload.get("pagination")
    if pagination is not None:
        for field in ("page", "page_size", "pages", "total"):
            assert field in pagination, f"Pagination missing {field}"
    return payload


async def clear_cart(client: httpx.AsyncClient, headers: dict[str, str]) -> None:
    snapshot = assert_envelope(await client.get("/api/cart", headers=headers))
    for item in snapshot["data"].get("items", []):
        await client.delete(f"/api/cart/{item['id']}", headers=headers)


async def scenario_products(client: httpx.AsyncClient, products: list[SeededProduct]) -> None:
    listing = assert_envelope(await client.get("/api/products"))
    assert listing["pagination"]["total"] == len(products)
    paged = assert_envelope(await client.get("/api/products", params={"page": 2, "page_size": 2}))
    assert paged["pagination"]["page"] == 2
    assert paged["pagination"]["pages"] == 2
    detail = assert_envelope(await client.get(f"/api/products/{products[0].id}"))
    assert detail["data"]["id"] == str(
        products[0].id
    ), f"Product detail mismatch: {detail['data']['id']} != {products[0].id}"


async def scenario_cart_and_orders(client: httpx.AsyncClient, products: list[SeededProduct], engine) -> None:
    user_payload = {"id": 987654, "first_name": "Smoke", "username": "smoke_user"}
    headers = {"X-Telegram-Init-Data": build_telegram_init_header(user_payload)}
    primary = products[0]
    # Cart add/remove
    created = assert_envelope(
        await client.post(
            "/api/cart",
            json={"product_id": str(primary.id), "size": primary.size, "quantity": 2},
            headers=headers,
        ),
        status=201,
    )
    cart = assert_envelope(await client.get("/api/cart", headers=headers))
    assert cart["data"]["total_minor_units"] >= primary.price_minor_units
    assert_envelope(await client.delete(f"/api/cart/{created['data']['id']}", headers=headers))
    empty = assert_envelope(await client.get("/api/cart", headers=headers))
    assert empty["data"]["total_minor_units"] == 0
    # Quantity limit
    assert_envelope(
        await client.post(
            "/api/cart",
            json={"product_id": str(primary.id), "size": primary.size, "quantity": 10},
            headers=headers,
        ),
        status=201,
    )
    limit_resp = await client.post(
        "/api/cart",
        json={"product_id": str(primary.id), "size": primary.size, "quantity": 1},
        headers=headers,
    )
    assert limit_resp.status_code == 422
    # Order creation
    await clear_cart(client, headers)
    assert_envelope(
        await client.post(
            "/api/cart",
            json={"product_id": str(primary.id), "size": primary.size, "quantity": 2},
            headers=headers,
        ),
        status=201,
    )
    order = assert_envelope(await client.post("/api/orders", json={}, headers=headers), status=201)
    assert len(order["data"]["items"]) == 1
    first_page = assert_envelope(
        await client.get("/api/orders", headers=headers, params={"page": 1, "page_size": 5})
    )
    assert first_page["pagination"]["total"] >= 1
    post_order_cart = assert_envelope(await client.get("/api/cart", headers=headers))
    assert post_order_cart["data"]["items"] == []
    # Empty cart error
    empty_order = await client.post("/api/orders", json={}, headers=headers)
    assert empty_order.status_code == 422
    # Overstock scenario
    overstock = products[1]
    assert_envelope(
        await client.post(
            "/api/cart",
            json={"product_id": str(overstock.id), "size": overstock.size, "quantity": 4},
            headers=headers,
        ),
        status=201,
    )
    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    async with session_factory() as session:
        variant = await session.get(ProductVariant, overstock.variant_id)
        if variant:
            variant.stock = 2
            await session.commit()
    overstock_resp = await client.post("/api/orders", json={}, headers=headers)
    assert overstock_resp.status_code == 422
    await clear_cart(client, headers)
    # User endpoint
    me = assert_envelope(await client.get("/api/users/me", headers=headers))
    assert me["data"]["telegram_id"] == user_payload["id"]


async def scenario_frontend_health() -> None:
    async with httpx.AsyncClient(base_url=FRONTEND_BASE_URL, timeout=10.0) as client:
        resp = await client.get("/")
        if resp.status_code != 200:
            raise AssertionError(f"Frontend unreachable: {resp.status_code}")
        assert "html" in resp.headers.get("content-type", ""), "Frontend did not return HTML"


async def run_smoke() -> None:
    engine = create_async_engine(DATABASE_URL, future=True, poolclass=NullPool)
    await reset_database(engine)
    products = await seed_products(engine)
    results: list[tuple[str, bool, str | None]] = []
    async with httpx.AsyncClient(base_url=BACKEND_BASE_URL, timeout=20.0) as client:
        await wait_for_backend(client)
        for name, coroutine in [
            ("Products endpoints", scenario_products(client, products)),
            ("Cart & orders endpoints", scenario_cart_and_orders(client, products, engine)),
        ]:
            try:
                await coroutine
                results.append((name, True, None))
            except Exception as exc:
                results.append((name, False, str(exc)))
    for name, coroutine in [("Frontend availability", scenario_frontend_health())]:
        try:
            await coroutine
            results.append((name, True, None))
        except Exception as exc:
            results.append((name, False, str(exc)))
    print("\nFull-stack smoke test summary:\n")
    for name, ok, msg in results:
        status = "✅ PASS" if ok else "❌ FAIL"
        detail = "" if not msg else f" - {msg}"
        print(f"{status} {name}{detail}")
    failures = [r for r in results if not r[1]]
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(run_smoke())
