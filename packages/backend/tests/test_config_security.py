from __future__ import annotations

import importlib
import os

import pytest


def _clear_environ(monkeypatch):
    for key in [
        "BRACE_ENVIRONMENT",
        "BRACE_REDIS_URL",
        "BRACE_ALLOW_DEV_MODE",
        "BRACE_TELEGRAM_DEV_MODE",
        "BRACE_TELEGRAM_DEV_FALLBACK_TOKEN",
        "BRACE_TELEGRAM_BOT_TOKEN",
        "TELEGRAM_BOT_TOKEN",
    ]:
        monkeypatch.delenv(key, raising=False)


def test_production_requires_redis(monkeypatch):
    """Production boot should fail fast without Redis."""
    _clear_environ(monkeypatch)
    monkeypatch.setenv("BRACE_ENVIRONMENT", "production")
    monkeypatch.setenv("BRACE_REDIS_URL", "memory://")
    monkeypatch.setenv("BRACE_TELEGRAM_BOT_TOKEN", "prod-secret")
    monkeypatch.setenv("BRACE_TELEGRAM_DEV_FALLBACK_TOKEN", "")
    from brace_backend.core import config

    with pytest.raises(RuntimeError, match="Redis is required in production"):
        importlib.reload(config)
    _clear_environ(monkeypatch)
    importlib.reload(config)


@pytest.mark.parametrize(
    "env_var",
    [
        "BRACE_ALLOW_DEV_MODE",
        "BRACE_TELEGRAM_DEV_MODE",
        "BRACE_TELEGRAM_DEV_FALLBACK_TOKEN",
    ],
)
def test_production_rejects_dev_shortcuts(monkeypatch, env_var):
    """Any dev shortcut should be refused in production."""
    _clear_environ(monkeypatch)
    monkeypatch.setenv("BRACE_ENVIRONMENT", "production")
    monkeypatch.setenv("BRACE_REDIS_URL", "redis://localhost:6379/0")
    monkeypatch.setenv("BRACE_TELEGRAM_BOT_TOKEN", "prod-secret")
    monkeypatch.setenv(env_var, "1")
    from brace_backend.core import config

    with pytest.raises(RuntimeError, match="Dev mode is not allowed in production"):
        importlib.reload(config)
    _clear_environ(monkeypatch)
    importlib.reload(config)
