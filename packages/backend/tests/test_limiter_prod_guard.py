from __future__ import annotations

import importlib

import pytest


def _reset_env(monkeypatch):
    for key in [
        "BRACE_ENVIRONMENT",
        "BRACE_REDIS_URL",
        "BRACE_DISABLE_RATE_LIMIT",
        "BRACE_TELEGRAM_BOT_TOKEN",
        "BRACE_TELEGRAM_DEV_FALLBACK_TOKEN",
    ]:
        monkeypatch.delenv(key, raising=False)


def test_rate_limiter_requires_redis_in_production(monkeypatch):
    _reset_env(monkeypatch)
    # Allow config to load, then force production-like settings on limiter
    monkeypatch.setenv("BRACE_ENVIRONMENT", "staging")
    monkeypatch.setenv("BRACE_REDIS_URL", "redis://localhost:6379/0")
    monkeypatch.setenv("BRACE_TELEGRAM_BOT_TOKEN", "prod-secret")
    monkeypatch.setenv("BRACE_TELEGRAM_DEV_FALLBACK_TOKEN", "")
    from brace_backend.core import config
    importlib.reload(config)
    from brace_backend.core import limiter as limiter_module
    importlib.reload(limiter_module)

    prod_settings = type(
        "ProdSettings",
        (),
        {
            "is_production": True,
            "disable_rate_limit": False,
            "redis_url": "memory://",
            "rate_limit": "60/minute",
        },
    )()

    monkeypatch.setattr(limiter_module, "settings", prod_settings)
    with pytest.raises(RuntimeError, match="Redis-backed rate limiting is required in production"):
        limiter_module._create_limiter()

    _reset_env(monkeypatch)
