# Analytics Runbook — BRACE

## Сигнал: ingestion упал до нуля
1) Проверить `/api/analytics/health` — `last_ingest_at` и `ingest_errors`.
2) Проверить логи backend (ошибки `analytics_ingest_rejected`).
3) Проверить CORS и доступность `/api/analytics/events` из WebApp.
4) Проверить `BRACE_ANALYTICS_ENABLED=true` и `BRACE_ANALYTICS_HASH_SALT`.
5) Проверить блокировку по rate limit (`BRACE_ANALYTICS_RATE_LIMIT`).

## Сигнал: всплеск ошибок ingestion
1) Посмотреть причины `validation_error` в логах.
2) Проверить ограничения `BRACE_ANALYTICS_MAX_BATCH_SIZE/BRACE_ANALYTICS_MAX_PAYLOAD_BYTES`.
3) Проверить, что фронт не отправляет PII или слишком большие payload.

## Сигнал: падение заказов/конверсии
1) Сравнить с 7‑дневной базой (`analytics_daily_metrics`).
2) Проверить нагрузку/ошибки API в логах.
3) Проверить наличие новых ошибок в UI (навигация, корзина).

## Экстренные действия
- Временно выключить аналитику: `BRACE_ANALYTICS_ENABLED=false`.
- Ограничить нагрузку: уменьшить `BRACE_ANALYTICS_MAX_BATCH_SIZE` и `VITE_ANALYTICS_BATCH_SIZE`.

## Ретеншн и обслуживание
- Запуск очистки: `python -m brace_backend.scripts.analytics_cleanup`
- Проверка размеров таблиц: `SELECT pg_size_pretty(pg_total_relation_size('analytics_events'));`

## Финальные прод‑проверки
- `/api/analytics/health` возвращает метрики, `ingest_errors=0`.
- Метрики rollup обновляются (`analytics_daily_metrics`).
- Cron‑задачи на rollup/alerts/report/cleanup присутствуют и выполняются.
- Metabase доступен только через SSH‑туннель.
- Для Metabase нужен read‑only пользователь БД `metabase_ro` (создается админом БД).

## Проверка сборки (prod build verification)
- Подготовить wheelhouse:
```
/root/brace__1/scripts/build_wheelhouse.sh /root/brace__1
```
- Пересобрать backend:
```
docker compose -f infra/docker-compose.prod.yml up -d --build backend
```
- Проверить health:
```
curl http://localhost:8000/api/analytics/health
```
