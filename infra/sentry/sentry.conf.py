import os
from sentry.conf.server import *  # noqa

SENTRY_OPTIONS.setdefault("system.secret-key", os.environ.get("SENTRY_SECRET_KEY", "please_override"))
SENTRY_TSDB = "sentry.tsdb.redissnuba.RedisSnubaTSDB"
SENTRY_TSDB_OPTIONS = {"cluster": "default"}
SENTRY_USE_RELAY = False
SENTRY_CACHE = "sentry.cache.redis.RedisCache"
SENTRY_CACHE_OPTIONS = {"cluster": "default"}
SENTRY_BROKER_URL = "redis://sentry-redis:6379/1"
BROKER_URL = SENTRY_BROKER_URL
SENTRY_RATELIMITER = "sentry.ratelimits.redis.RedisRateLimiter"
SENTRY_RATELIMITER_OPTIONS = {"cluster": "default"}
SENTRY_EVENTSTREAM = "sentry.eventstream.kafka.KafkaEventStream"
SENTRY_EVENTSTREAM_OPTIONS = {"bootstrap.servers": "sentry-kafka:9092", "topic": "events"}
SENTRY_OPTIONS["redis.clusters"] = {
    "default": {"hosts": [{"host": "sentry-redis", "port": 6379, "db": 0}]},
}
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://sentry-redis:6379/0",
    }
}
DATABASES["default"]["USER"] = os.environ.get("SENTRY_DB_USER", "sentry")
DATABASES["default"]["PASSWORD"] = os.environ.get("SENTRY_DB_PASSWORD", "sentry")
DATABASES["default"]["NAME"] = os.environ.get("SENTRY_DB_NAME", "sentry")
DATABASES["default"]["HOST"] = os.environ.get("SENTRY_POSTGRES_HOST", "sentry-postgres")
DATABASES["default"]["PORT"] = os.environ.get("SENTRY_POSTGRES_PORT", "5432")
