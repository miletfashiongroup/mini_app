# BI и дашборды (Metabase)

## Быстрый старт
<<<<<<< HEAD
1) Скопировать `infra/metabase/.env.metabase.example` в `infra/metabase/.env.metabase`.
=======
1) Скопировать `infra/metabase/metabase.env.example` в `/etc/brace/secrets/metabase/metabase.env`.
>>>>>>> f313b8a46037aa845ec1c2a17a6126ea14c2331d
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
<<<<<<< HEAD
=======

## Продакшн-доступ и безопасность
- Metabase слушает только `127.0.0.1:3000`.
- SSH-туннель с ноутбука:
```
ssh -i ~/.ssh/braceTG -L 3000:127.0.0.1:3000 root@79.174.93.119
```
- Админ-пароль Metabase сохранен на VPS в `infra/metabase/admin.pass`.
- Конфиг Metabase хранится в `infra/metabase/.env.metabase` (не коммитится).

## Первичная настройка Metabase на VPS
1) Metabase уже поднят и инициализирован локальным H2-хранилищем (временное решение).
2) Для прод-уровня нужно переключить внутреннюю БД Metabase на Postgres.
3) Требуется роль с правами CREATEROLE в основной БД (см. ниже).

## Подключение аналитической БД (read-only)
- Требуется read-only пользователь `metabase_ro` в Postgres.
- Без роли с правами CREATEROLE создать его невозможно.
- Как только будут выданы админ‑доступы к Postgres, создать пользователя:
  - логин: `metabase_ro`
  - права: `CONNECT` к `brace_prod`, `USAGE` на `public`, `SELECT` на таблицы аналитики.
- Пароль для `metabase_ro` нужно сохранить на VPS в `infra/metabase/mb_ro.pass`.

## Временный статус
- Metabase работает локально, но подключение к Postgres в режиме read-only ожидает выдачи прав на создание ролей.

## Секреты и конфиги (VPS)
- `admin` пароль: `/etc/brace/secrets/metabase/admin.pass`
- env для Metabase: `/etc/brace/secrets/metabase/metabase.env`
- Эти файлы не находятся в репозитории и имеют `chmod 600`.

## Переход на Postgres для Metabase (обязательно для прод)
1) Выполнить SQL‑скрипт с правами `CREATEROLE`/`CREATEDB`:
```
psql -h 79.174.88.146 -p 19051 -d postgres -U <dba_user> -f /root/brace__1/infra/db/create_metabase_roles.sql
```
2) Обновить `/etc/brace/secrets/metabase/metabase.env`:
```
MB_DB_TYPE=postgres
MB_DB_HOST=79.174.88.146
MB_DB_PORT=19051
MB_DB_DBNAME=metabase_prod
MB_DB_USER=metabase_app
MB_DB_PASS=REPLACE_WITH_STRONG_PASSWORD
MB_PASSWORD_COMPLEXITY=strong
MB_PASSWORD_LENGTH=12
```
3) Перезапустить Metabase:
```
docker compose -f infra/docker-compose.metabase.yml up -d
```

## Read-only подключение к аналитике
- После создания роли `metabase_ro` подключить БД `brace_prod` в Metabase как read‑only.
>>>>>>> f313b8a46037aa845ec1c2a17a6126ea14c2331d
