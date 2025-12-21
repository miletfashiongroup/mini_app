# Подробный гайд по созданию и настройке базы данных для проекта BRACE

Этот документ объясняет, какие таблицы/поля/схемы нужны проекту, и как правильно
развернуть PostgreSQL на сервере REG.RU с учетом безопасности и надежности.
Расчитано на читателя без опыта.

## 1) Что такое схема, таблица и миграции (коротко)

- Схема (schema) — логическая "папка" внутри базы данных. По умолчанию используется `public`.
- Таблица — набор строк (записей) с фиксированными колонками.
- Миграции — файлы, которые последовательно создают/меняют таблицы. В проекте это Alembic
  (папка `packages/backend/alembic`).

Проект BRACE использует:
- PostgreSQL
- SQLAlchemy (async) и Alembic для миграций
- PII-шифрование через Fernet (чувствительные данные пользователей)

## 2) Итоговая схема базы (актуальное состояние)

Ниже список таблиц и всех полей. Все `id` — UUID. Все временные поля — UTC.

### Общие поля (присутствуют у большинства таблиц)
- `id` UUID PRIMARY KEY
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now() и обновляется при изменениях

### Таблица `users`
Назначение: пользователь Telegram Mini App.

Поля:
- `id` UUID PK
- `created_at`, `updated_at`
- `telegram_id` BIGINT UNIQUE NOT NULL (индексируется)
- `first_name` VARCHAR(255) (зашифрованное значение)
- `last_name` VARCHAR(255) (зашифрованное значение)
- `username` VARCHAR(255) (зашифрованное значение)
- `language_code` VARCHAR(10)
- `role` VARCHAR(20) NOT NULL DEFAULT 'user'

Ограничения:
- CHECK: `role in ('user','admin')`

Индексы:
- `ix_users_username`
- индекс на `telegram_id` (unique + index)

Связи:
- 1:N с `orders`
- 1:N с `cart_items`

### Таблица `products`
Назначение: карточки товаров.

Поля:
- `id` UUID PK
- `created_at`, `updated_at`
- `name` VARCHAR(255) NOT NULL
- `description` TEXT
- `hero_media_url` VARCHAR(512)
- `category` VARCHAR(50)
- `is_new` BOOLEAN NOT NULL DEFAULT false
- `rating_value` FLOAT NOT NULL DEFAULT 0
- `rating_count` INTEGER NOT NULL DEFAULT 0
- `tags` TEXT[] (PostgreSQL ARRAY) / JSON в иных БД
- `specs` TEXT[] (PostgreSQL ARRAY) / JSON в иных БД
- `is_deleted` BOOLEAN NOT NULL (soft delete)
- `deleted_at` TIMESTAMPTZ NULL

Индексы:
- `ix_products_category_created` (category, created_at)

Связи:
- 1:N с `product_variants`
- 1:N с `product_media`
- 1:N с `order_items`
- 1:N с `cart_items`

### Таблица `product_variants`
Назначение: варианты товара (размеры/модификации).

Поля:
- `id` UUID PK
- `created_at`, `updated_at`
- `product_id` UUID FK -> `products.id` (ON DELETE CASCADE)
- `size` VARCHAR(10) NOT NULL
- `stock` INTEGER NOT NULL DEFAULT 0
- `is_deleted` BOOLEAN NOT NULL
- `deleted_at` TIMESTAMPTZ NULL

Ограничения:
- UNIQUE (`product_id`, `size`)
- CHECK `stock >= 0`

Связи:
- N:1 с `products`
- 1:N с `product_prices`

### Таблица `product_prices`
Назначение: история цен (версионирование).

Поля:
- `id` UUID PK
- `created_at`, `updated_at`
- `product_variant_id` UUID FK -> `product_variants.id` (ON DELETE CASCADE)
- `price_minor_units` BIGINT NOT NULL (копейки)
- `currency_code` VARCHAR(3) NOT NULL DEFAULT 'RUB'
- `starts_at` TIMESTAMPTZ NOT NULL
- `ends_at` TIMESTAMPTZ NULL

Ограничения:
- UNIQUE (`product_variant_id`, `starts_at`)
- CHECK `price_minor_units >= 0`
- CHECK `(ends_at IS NULL) OR (starts_at < ends_at)`
- EXCLUDE (PostgreSQL only): запрет пересечения окон времени цены для одной вариации

Индексы:
- `ix_product_prices_variant_window` (`product_variant_id`, `starts_at`)

### Таблица `product_media`
Назначение: галерея изображений товара.

Поля:
- `id` UUID PK
- `created_at`, `updated_at`
- `product_id` UUID FK -> `products.id` (ON DELETE CASCADE)
- `url` VARCHAR(512) NOT NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `is_deleted` BOOLEAN NOT NULL
- `deleted_at` TIMESTAMPTZ NULL

### Таблица `cart_items`
Назначение: корзина пользователя.

Поля:
- `id` UUID PK
- `created_at`, `updated_at`
- `user_id` UUID FK -> `users.id` (ON DELETE CASCADE)
- `product_id` UUID FK -> `products.id` (ON DELETE CASCADE)
- `variant_id` UUID FK -> `product_variants.id` (ON DELETE CASCADE)
- `size` VARCHAR (фактически строка размера)
- `quantity` INTEGER NOT NULL DEFAULT 1
- `unit_price_minor_units` BIGINT NOT NULL

Ограничения:
- UNIQUE (`user_id`, `variant_id`)
- CHECK `quantity > 0`
- CHECK `unit_price_minor_units >= 0`

Индексы:
- `ix_cart_items_user` (user_id)
- `ix_cart_items_variant` (variant_id)

### Таблица `orders`
Назначение: заказ пользователя.

Поля:
- `id` UUID PK
- `created_at`, `updated_at`
- `user_id` UUID FK -> `users.id` (ON DELETE CASCADE)
- `status` VARCHAR(50) NOT NULL DEFAULT 'pending'
- `total_amount_minor_units` BIGINT NOT NULL DEFAULT 0
- `shipping_address` VARCHAR(512) NULL
- `note` TEXT NULL
- `idempotency_key` VARCHAR(128) NOT NULL

Ограничения:
- UNIQUE (`user_id`, `idempotency_key`)
- CHECK `total_amount_minor_units >= 0`

Индексы:
- `ix_orders_user_created` (user_id, created_at)

### Таблица `order_items`
Назначение: позиции заказа.

Поля:
- `id` UUID PK
- `created_at`, `updated_at`
- `order_id` UUID FK -> `orders.id` (ON DELETE CASCADE)
- `product_id` UUID FK -> `products.id`
- `size` VARCHAR(10)
- `quantity` INTEGER NOT NULL DEFAULT 1
- `unit_price_minor_units` BIGINT NOT NULL

Ограничения:
- CHECK `quantity > 0`
- CHECK `unit_price_minor_units >= 0`

### Таблица `banners`
Назначение: баннеры/слайдеры.

Поля:
- `id` UUID PK
- `created_at`, `updated_at`
- `image_url` VARCHAR(512) NOT NULL
- `video_url` VARCHAR(512) NULL
- `is_active` BOOLEAN NOT NULL DEFAULT false
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `is_deleted` BOOLEAN NOT NULL
- `deleted_at` TIMESTAMPTZ NULL

### Таблица `audit_logs`
Назначение: аудит действий (безопасность и трассировка).

Поля:
- `id` UUID PK
- `created_at`, `updated_at`
- `actor_user_id` UUID NULL (кто сделал действие)
- `action` VARCHAR(64) NOT NULL
- `entity_type` VARCHAR(64) NOT NULL
- `entity_id` VARCHAR(128) NOT NULL
- `metadata` JSON NULL
- `ip_address` VARCHAR(64) NULL
- `user_agent` VARCHAR(512) NULL
- `occurred_at` TIMESTAMPTZ NOT NULL DEFAULT now()

Индексы:
- `ix_audit_actor` (actor_user_id)
- `ix_audit_entity` (entity_id)

## 3) Подготовка PostgreSQL на REG.RU (SSH)

Ниже шаги для сервера с доступом по SSH. Команды безопасны, но выполняйте
осознанно. Все значения с `***` замените на свои.

### 3.1 Убедитесь, что PostgreSQL установлен и запущен

```bash
sudo systemctl status postgresql
```

Если Postgres не установлен, установите через пакетный менеджер вашей ОС.

### 3.2 Создайте отдельные роли: владелец и приложение

Цель: приложение не должно быть суперпользователем.

Откройте psql:
```bash
sudo -u postgres psql
```

Создайте владельца и роль приложения:
```sql
-- Владелец базы (для миграций)
CREATE ROLE brace_owner LOGIN PASSWORD '***strong-owner-password***';

-- Роль приложения (минимальные права)
CREATE ROLE brace_app LOGIN PASSWORD '***strong-app-password***';
```

### 3.3 Создайте базу данных

```sql
CREATE DATABASE brace_prod OWNER brace_owner;
```

### 3.4 Минимальные права для роли приложения

Выполните под суперпользователем или владельцем:
```sql
REVOKE TEMPORARY ON DATABASE brace_prod FROM PUBLIC;
GRANT CONNECT ON DATABASE brace_prod TO brace_app;

-- Права на схему public
ALTER SCHEMA public OWNER TO brace_owner;
GRANT USAGE ON SCHEMA public TO brace_app;
GRANT CREATE ON SCHEMA public TO brace_owner;

-- Права на таблицы/последовательности (текущее состояние)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO brace_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO brace_app;

-- Права по умолчанию для новых таблиц/последовательностей
ALTER DEFAULT PRIVILEGES FOR ROLE brace_owner IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO brace_app;

ALTER DEFAULT PRIVILEGES FOR ROLE brace_owner IN SCHEMA public
GRANT ALL ON SEQUENCES TO brace_app;
```

### 3.5 Настройка доступа через SSH-туннель

Самый безопасный вариант — не открывать Postgres наружу, а подключаться через туннель.

На локальной машине (или на сервере CI), откройте туннель:
```bash
ssh -L 5433:localhost:5432 <ssh_user>@<ssh_host>
```

Теперь Postgres на сервере доступен локально как `localhost:5433`.

## 4) Настройка переменных окружения (backend)

Основные переменные:
- `BRACE_DATABASE_URL` (async)
- `ALEMBIC_DATABASE_URL` (sync)
- `BRACE_PII_ENCRYPTION_KEY` (обязателен для продакшена)

Пример для подключения через SSH-туннель:
```
BRACE_DATABASE_URL=postgresql+psycopg_async://brace_app:***app-pass***@localhost:5433/brace_prod
ALEMBIC_DATABASE_URL=postgresql+psycopg://brace_owner:***owner-pass***@localhost:5433/brace_prod
```

Если вы запускаете миграции от имени владельца (brace_owner), это правильно.
Приложение должно работать от имени `brace_app`.

### Генерация ключа для PII-шифрования

```bash
python - <<'PY'
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
PY
```

Значение поместите в `BRACE_PII_ENCRYPTION_KEY`. Не теряйте ключ.

## 5) Применение миграций (создание таблиц)

Все миграции лежат в `packages/backend/alembic/versions`.

Запускать миграции нужно из `packages/backend`:
```bash
cd packages/backend
poetry run alembic upgrade head
```

Важно:
- Миграция `202501010001_security_price_history.py` требует `BRACE_PII_ENCRYPTION_KEY`.
- При наличии пользователей произойдет шифрование `first_name`, `last_name`, `username`.

## 6) Наполнение демо-данными (необязательно)

```bash
cd packages/backend
poetry run python -m brace_backend.services.seed
```

## 7) Рекомендации Senior/Principal уровня (безопасность и надежность)

### Безопасность
- Не используйте суперпользователя для приложения.
- Храните `BRACE_PII_ENCRYPTION_KEY` и пароли в секретах (не в git).
- Используйте SSH-туннель вместо публичного доступа к Postgres.
- Ограничьте доступ в `pg_hba.conf` только локальным подключениям и/или через SSH.
- Отключите небезопасные настройки (например, не включайте `log_statement = all` в проде).

### Бэкапы
- Настройте ежедневные бэкапы (pg_dump или snapshot, если есть).
- Регулярно проверяйте восстановление на тестовой базе.

### Надежность и мониторинг
- Следите за `pg_stat_activity`, `pg_stat_statements`.
- Мониторьте размер таблиц, индексов, наличие bloat.
- Настройте алерты по диску, CPU, памяти.

### Консистентность данных
- Деньги хранятся в `*_minor_units` (копейки). Никогда не храните float.
- `idempotency_key` на заказах защищает от дубликатов.
- Soft delete используется для товаров/вариантов/медиа/баннеров.

### Производительность
- Индексы уже учтены в миграциях (см. раздел "Схема").
- Не забудьте `CREATE EXTENSION btree_gist;` (делается миграцией) для ограничения цен.

## 8) Быстрая проверка, что все работает

1) Открыт SSH-туннель.
2) Запущены миграции.
3) Приложение подключается по `BRACE_DATABASE_URL`.

Проверить доступ:
```bash
psql "postgresql://brace_app:***app-pass***@localhost:5433/brace_prod"
```

Если видите приглашение psql — подключение готово.
