# Analytics для BRACE — как использовать

## 1) Включение
1) Применить миграции:
   - `poetry run alembic upgrade head`
2) Добавить переменные окружения:
   - `BRACE_ANALYTICS_ENABLED=true`
   - `BRACE_ANALYTICS_HASH_SALT=ваша_соль`
3) Перезапустить backend.
4) Проверить health:
   - `GET /api/analytics/health`

## 2) Ежедневные агрегации (ETL)
Запуск вручную:
```
poetry run python -m brace_backend.scripts.analytics_rollup --date 2025-02-17
```

Cron (пример, 03:15 UTC ежедневно):
```
15 3 * * * /usr/bin/env BRACE_DATABASE_URL=... BRACE_ANALYTICS_HASH_SALT=... poetry run python -m brace_backend.scripts.analytics_rollup
```

## 3) Алерты
Ручной запуск:
```
poetry run python -m brace_backend.scripts.analytics_alerts --date 2025-02-17
```

Рекомендуемый cron:
```
30 3 * * * /usr/bin/env BRACE_DATABASE_URL=... poetry run python -m brace_backend.scripts.analytics_alerts
```

## 4) Готовые SQL‑запросы
См. `SQL_REPORTS.sql` — внизу добавлены отчеты по воронке и CTR.

## 5) Проверка качества данных
1) Открыть приложение → проверить, что записи появились в `analytics_events`.
2) Создать заказ → проверить `order_created` в `analytics_events` и в `orders`.
3) Проверить дедупликацию по `event_id`.
4) Убедиться, что в `properties/context` нет PII.
5) Прогнать тесты:
```
make analytics-test
```

## 6) Очистка и ретеншн
```
poetry run python -m brace_backend.scripts.analytics_cleanup
```

## 7) Партиционирование (опционально)
```
poetry run python -m brace_backend.scripts.analytics_partitions --month 2025-02
```

## 8) Отчеты в Telegram
Требуются переменные:
- `BRACE_ANALYTICS_REPORT_ENABLED=true`
- `BRACE_ANALYTICS_REPORT_RECIPIENT_IDS=12345,67890`

```
poetry run python -m brace_backend.scripts.analytics_report --type daily
poetry run python -m brace_backend.scripts.analytics_report --type weekly
```

Cron примеры:
```
15 4 * * * /usr/bin/env BRACE_DATABASE_URL=... BRACE_ANALYTICS_REPORT_ENABLED=true BRACE_ANALYTICS_REPORT_RECIPIENT_IDS=123 poetry run python -m brace_backend.scripts.analytics_report --type daily
30 4 * * 1 /usr/bin/env BRACE_DATABASE_URL=... BRACE_ANALYTICS_REPORT_ENABLED=true BRACE_ANALYTICS_REPORT_RECIPIENT_IDS=123 poetry run python -m brace_backend.scripts.analytics_report --type weekly
```

## Production checklist
- Миграции применены, таблицы созданы.
- `BRACE_ANALYTICS_HASH_SALT` задан.
- `/api/analytics/health` возвращает метрики.
- Роллап и очистка настроены через cron.
- Metabase поднят и подключен к БД.
- Алерты отправляются в Telegram админам.

## VPS deployment (SSH)
1) Зайти на сервер:
```
ssh -i ~/.ssh/braceTG root@79.174.93.119
```
2) Обновить репозиторий и пересобрать контейнеры:
```
cd /root/brace__1
docker compose -f infra/docker-compose.prod.yml up -d --build backend frontend
```
3) Применить миграции (entrypoint делает автоматически, но можно проверить):
```
docker logs infra-backend-1 --tail 200
```
4) Поднять Metabase:
```
docker compose -f infra/docker-compose.metabase.yml up -d
```
