# BI и дашборды (Metabase)

## Быстрый старт
1) Скопировать `infra/metabase/.env.metabase.example` в `infra/metabase/.env.metabase`.
2) Поднять Metabase:
```
docker compose -f infra/docker-compose.metabase.yml up -d
```
3) Metabase слушает только localhost. Для доступа с локальной машины:
```
ssh -i ~/.ssh/braceTG -L 3000:127.0.0.1:3000 root@79.174.93.119
```
4) Открыть `http://localhost:3000` и подключить основную БД (Postgres) через read‑only пользователя.

## Рекомендованные SQL‑вьюхи
Скопировать в Metabase SQL Editor и сохранить как Views/Questions.

### 1) DAU/WAU
```sql
WITH daily AS (
  SELECT DATE(occurred_at) AS day,
         COUNT(DISTINCT session_id) AS dau
  FROM analytics_events
  GROUP BY 1
)
SELECT day, dau
FROM daily
ORDER BY day DESC;
```

### 2) Воронка: product_view → add_to_cart → checkout_start
```sql
SELECT
  DATE(occurred_at) AS day,
  COUNT(*) FILTER (WHERE name = 'product_view') AS product_view,
  COUNT(*) FILTER (WHERE name = 'add_to_cart') AS add_to_cart,
  COUNT(*) FILTER (WHERE name = 'checkout_start') AS checkout_start
FROM analytics_events
GROUP BY 1
ORDER BY day DESC;
```

### 3) Топ‑товары по просмотрам и add_to_cart
```sql
SELECT
  properties->>'product_id' AS product_id,
  COUNT(*) FILTER (WHERE name = 'product_view') AS product_views,
  COUNT(*) FILTER (WHERE name = 'add_to_cart') AS add_to_cart
FROM analytics_events
WHERE name IN ('product_view', 'add_to_cart')
GROUP BY 1
ORDER BY add_to_cart DESC NULLS LAST, product_views DESC;
```

### 4) Search / Filter usage (появится после внедрения событий)
```sql
SELECT
  DATE(occurred_at) AS day,
  COUNT(*) FILTER (WHERE name = 'search_used') AS search_used,
  COUNT(*) FILTER (WHERE name = 'filter_applied') AS filter_applied
FROM analytics_events
GROUP BY 1
ORDER BY day DESC;
```

### 5) Error overview (клиентские ошибки)
```sql
SELECT
  DATE(occurred_at) AS day,
  COUNT(*) AS errors,
  properties->>'error_code' AS error_code
FROM analytics_events
WHERE name = 'order_failed'
GROUP BY 1, 3
ORDER BY day DESC;
```

## Производительность
- Для дашбордов используйте `analytics_daily_metrics`, если нужен тренд по дням.
- Для ad‑hoc запросов по событиям используйте фильтр по `occurred_at`.
