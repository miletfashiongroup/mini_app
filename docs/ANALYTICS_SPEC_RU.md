# Аналитика для BRACE (Telegram Mini App) — спецификация и план внедрения

Документ описывает продуктовую и бизнес‑аналитику, схему событий, метрики и реализацию
в текущем коде. Все определения однозначные, ориентированы на практическую работу.

## 0) Контекст и допущения
- Приложение: Telegram Mini App (WebApp) для интернет‑магазина мужского белья.
- Стек: фронтенд React + Vite (TS), бэкенд FastAPI (Python), БД PostgreSQL.
- Платёжного провайдера пока нет: заказ считается созданным при `POST /orders`.
- Когда появится оплата, добавить события `payment_start`, `payment_success`, `payment_failed`.
- Telegram initData доступен, но пользовательский идентификатор не сохраняется в сыром виде.

## A) Analytics spec

### A1) Цели (product + business)
1) Понять воронку: просмотр → добавление в корзину → оформление заказа.
2) Повысить конверсию и выручку: найти узкие места по товарам/размерам.
3) Улучшить UX: где отваливаются, какие экраны тормозят/ломаются.
4) Обеспечить безопасность и качество данных без лишнего PII.

### A2) Персоны и ключевые сценарии
- Новый покупатель: впервые открыл мини‑приложение → каталог → карточка → корзина.
- Возвращающийся покупатель: повторные заказы → подбор размера → оформление.
- Исследователь: смотрит карточки, меняет размеры, сравнивает характеристики.

Ключевые journey:
1) App Open → Catalog View → Product View → Add to Cart → Cart View → Checkout Start → Order Created.
2) App Open → Product View → Back → Catalog View → Add to Cart.
3) App Open → Cart View → Remove → Exit.

### A3) North Star Metric + supporting metrics
**North Star:** `Заказы на активную сессию`
Формула: `order_created / sessions` за период.

Поддерживающие:
- Конверсия в заказ: `order_created / sessions`
- CR добавления в корзину: `add_to_cart / product_view`
- CR чекаута: `order_created / checkout_start`
- AOV: `revenue / order_created`
- Revenue: сумма `order.total_amount_minor_units`
- Retention D1/D7/D30: доля пользователей, вернувшихся в окно.

### A4) Воронка
Шаги (по сессии):
1) `app_open`
2) `catalog_view` или `product_view`
3) `add_to_cart`
4) `checkout_start`
5) `order_created` (серверная фиксация, пока нет оплаты)
6) `payment_success` (после интеграции платежей)

### A5) Метрики каталога
- CTR карточек: `product_view / catalog_view`
- Использование вкладок: `catalog_tab_change / catalog_view`
- Выбор размера: `size_selected / product_view`
- Влияние отсутствия размера: доля `add_to_cart_failed` из‑за `out_of_stock`
- Поиск и фильтры (когда появятся): `search_used`, `filter_applied`, `search_to_product_view`

### A6) Retention и когорты
- D1/D7/D30 retention по дате первой сессии.
- Cohort LTV: сумма заказов по когорте / кол‑во пользователей в когорте.

### A7) Качество
- Ошибки сети/серверов: `api_error` (если фиксируем).
- Стабильность: доля успешных `order_created` после `checkout_start`.
- Перформанс: длительность загрузки каталога/карточки (если добавим тайминг).

### A8) Fraud/abuse сигналы (privacy‑safe)
- Аномально частые `order_created` на одну сессию/анонимный id.
- Высокая доля `order_created` без `product_view` (бот‑поведение).
- Серии `checkout_start` без заказов.

### A9) Определения и формулы (ключевые)
- `sessions`: количество уникальных `session_id` за период.
- `users`: количество уникальных `user_id_hash` (псевдоним).
- `add_to_cart`: количество событий `add_to_cart`.
- `checkout_start`: количество событий `checkout_start`.
- `order_created`: количество заказов по таблице `orders` или серверным событиям.
- `conversion_rate`: `order_created / sessions`.
- `AOV`: `revenue / order_created`, где `revenue = SUM(order.total_amount_minor_units)`.
- `CTR`: `product_view / catalog_view`.
- `DAU`: уникальные `session_id` за день.
- `WAU`: уникальные `session_id` за 7 дней.

## B) Tracking plan

### B1) Общие свойства (context)
Общие поля на каждый batch:
- `schema_version` (int) — версия схемы.
- `session_id` — UUID сессии.
- `device_id` — локальный идентификатор устройства (localStorage).
- `anon_id` — анонимный идентификатор (localStorage).
- `app_version` — версия фронтенда (если задана в env).
- `platform` — `WebApp.platform`.
- `tg_client_version` — `WebApp.version`.
- `locale` — `WebApp.initDataUnsafe.user.language_code` или `navigator.language`.
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`.
- `referrer` — `document.referrer` или `start_param`.
- `screen` — текущий маршрут.
- `experiment` — флаги экспериментов (если появятся).

### B2) Таксономия событий
События и требования:

1) `app_open`
- Когда: при первом рендере приложения в новой сессии.
- Обязательные свойства: `first_open` (bool).

2) `screen_view`
- Когда: при смене маршрута.
- Обязательные свойства: `screen`.

3) `catalog_view`
- Когда: загрузился каталог (успешно).
- Свойства: `items_count`, `category` (если выбран таб).

4) `catalog_tab_change`
- Когда: пользователь переключил таб в каталоге.
- Свойства: `from_category`, `to_category`.

5) `product_view`
- Когда: карточка товара показана пользователю.
- Свойства: `product_id`, `category`, `price_minor_units`, `currency`.

6) `size_selected`
- Когда: выбран размер в карточке.
- Свойства: `product_id`, `size`.

7) `add_to_cart`
- Когда: товар добавлен в корзину (успешно).
- Свойства: `product_id`, `size`, `quantity`, `price_minor_units`, `currency`.

8) `cart_view`
- Когда: экран корзины открыт.
- Свойства: `cart_items`, `cart_total_minor_units`, `currency`.

9) `cart_item_remove`
- Когда: удаление позиции.
- Свойства: `product_id`, `size`, `quantity`.

10) `cart_quantity_change`
- Когда: изменение количества.
- Свойства: `product_id`, `size`, `prev_quantity`, `next_quantity`.

11) `checkout_start`
- Когда: пользователь нажал «оформить заказ».
- Свойства: `cart_items`, `cart_total_minor_units`, `currency`.

12) `order_created` (сервер)
- Когда: заказ создан на бэкенде.
- Свойства: `order_id`, `order_total_minor_units`, `currency`, `items_count`.

13) `order_failed`
- Когда: бэкенд вернул ошибку оформления.
- Свойства: `error_code`.

14) `search_used` (будущая интеграция)
- Когда: пользователь использует поиск.
- Свойства: `query`.

15) `filter_applied` (будущая интеграция)
- Когда: применен фильтр каталога.
- Свойства: `filter_name`.

16) `payment_success` / `payment_failed` (будущая интеграция)
- Когда: подтверждение/ошибка оплаты.
- Свойства: `payment_method`, `amount_minor_units`, `currency`, `error_code`.

### B3) Версионирование схем
- `schema_version` — общий формат batch.
- `event_version` — версия конкретного события.
- При изменениях: увеличить версию + поддерживать валидацию на бэкенде.

## C) Реализация (high‑level)
- Клиентский трекер: очередь, батчи, retry/backoff, offline‑режим, дедупликация.
- Серверный ingestion: валидация схем, rate limit, idempotency по `event_id`.
- Хранилище: PostgreSQL (`analytics_events`, `analytics_daily_metrics`).
- ETL/rollup: ежедневная агрегация.
- Дашборды: SQL‑вьюхи и шаблонные запросы.
- Ретеншн: сырые события 180 дней, rollup — 3 года (настраивается).
- Партиционирование: опционально через скрипт `analytics_partitions` для месяцев.

## Privacy & Security (кратко)
- Идентификаторы хэшируются на сервере (HMAC + соль).
- PII ключи отбрасываются на ingestion (`phone`, `email`, `username` и т.д.).
- Payload ограничен по размеру и количеству свойств.
- Rate limit на `/analytics/events`.
- Операционные метрики доступны в `/api/analytics/health`.

## D) Rollout план
Stage 1 (минимум):
- `app_open`, `screen_view`, `product_view`, `add_to_cart`, `cart_view`, `checkout_start`, `order_created`.

Stage 2 (каталог + ретеншн):
- `catalog_view`, `catalog_tab_change`, `size_selected`, `cart_quantity_change`, `cart_item_remove`.
- Retention D1/D7/D30.

Stage 3 (эксперименты):
- `experiment_view`, `experiment_conversion`.
- Персонализация: сегменты по размерам/категориям.

## QA checklist (перед продом)
- События приходят в `analytics_events`.
- `order_created` логируется сервером.
- Дедупликация по `event_id` работает.
- Нет PII в `properties` и `context`.
- Воронка и метрики считаются корректно.
- Алёрты настроены на спад конверсии/рост ошибок.

## Как использовать (операционно)
1) Применить миграции.
2) Включить переменные аналитики (см. ENV_VARIABLES.md).
3) Запустить ETL‑скрипт по расписанию (cron).
4) Использовать SQL‑запросы из `SQL_REPORTS.sql`.
