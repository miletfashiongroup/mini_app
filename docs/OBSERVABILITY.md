# Observability Guide

## Metrics
- Endpoint: `/metrics` on backend service (Prometheus format). Enabled by `prometheus-fastapi-instrumentator` in `brace_backend.main`.
- Scrape suggestion: job `brace-backend` with target `infra-backend-1:8000`. If exposing via nginx, add `/metrics` location protected by basic auth/IP allowlist.
- Key metrics: `http_requests_total`/`http_request_duration_seconds`, custom `slowapi` limits, database pool metrics (SQLAlchemy), bot callback failure counter `admin_bot_status_failed` (log-derived, add alert via log-based metric).

## Health Checks
- HTTP: `GET /api/health` returns 200 when app + DB reachable.
- Container: socket-based checks in `infra/docker-compose.prod.yml` for backend, admin-bot, support-bot, scheduler (connects to DB/Redis on start).

## Logging
- Structured JSON when `BRACE_LOG_JSON=true`.
- Log levels set via `BRACE_LOG_LEVEL` (`INFO` in prod). Default sink: stdout for Docker; route to Loki/CloudWatch via docker logging driver if available.

## Tracing
- Not enabled by default. To add OpenTelemetry, set `OTEL_EXPORTER_OTLP_ENDPOINT` and run `opentelemetry-instrument --traces_exporter otlp_proto_http uvicorn ...` (left as future work).

## Alerting (recommended quick wins)
- 5xx rate > 1% over 5m.
- P95 HTTP latency > 1s over 5m.
- Bot callback failure count (`admin_bot_status_failed`) > 3 in 5m.
- Database connection errors (`psycopg.OperationalError`).
- Backup freshness > 26h (see `check_backup_freshness.sh`).

## Dashboards
- Start with: Requests rate/latency, Error rate, DB connections, Redis ops, bot callback success/failure. Wire Prometheus → Grafana if available.

## Smoke Tests
- Manual: `API_URL=https://bracefashion.online bash scripts/smoke_manual.sh` (read-only). Extend script for staging to run order lifecycle using test DB/user.

## Alert Rules (sample Prometheus)
```
- alert: HighErrorRate
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.01
  for: 5m
  labels: {severity: critical}
  annotations: {summary: "5xx >1%"}
- alert: HighLatencyP95
  expr: histogram_quantile(0.95, sum by (le)(rate(http_request_duration_seconds_bucket[5m]))) > 1
  for: 5m
  labels: {severity: warning}
- alert: AdminBotStatusFailures
  expr: increase(admin_bot_status_failed_total[5m]) > 3
  labels: {severity: critical}
- alert: BackupStale
  expr: time() - brace_backup_timestamp_seconds > 93600
  labels: {severity: warning}
```

## Dashboards (Grafana starter panels)
- Requests rate/latency/error by route and status
- Bot callbacks success/fail by status
- DB pool usage, SQL timings, slow queries count
- Redis ops/sec and errors
- Custom business: orders created, status transitions, payment attempts (when added)

## WebVisor / Metrika Notes
- Telegram WebView CSP blocks inline scripts; use hosted loaders (`/metrika-tag.js`, `/metrika.js`) already present.
- Enable WebVisor in Metrika UI; no code change needed after CSP-safe loader. For SPA hits, emit `ym(counterId, hit, url)` on route changes if telemetry is required beyond current `/api/analytics/events` pipeline.
