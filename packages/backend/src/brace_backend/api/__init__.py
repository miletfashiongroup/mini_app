from fastapi import APIRouter

from brace_backend.api import main_screen
from brace_backend.api.routes import cart, health, orders, products, telegram, users

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(products.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)
api_router.include_router(users.router)
api_router.include_router(telegram.router)
api_router.include_router(main_screen.router)

__all__ = ["api_router"]
