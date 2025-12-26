# Инструкции по работе с VPS и сервисами

Ниже краткий чек-лист для подключения, диагностики и деплоя. Секреты (токены, пароли) не печатать и не вставлять в команды напрямую.

## Подключение

```bash
ssh -i ~/.ssh/braceTG root@79.174.93.119
```

## Статус сервисов

```bash
docker compose -f /root/brace__1/infra/docker-compose.prod.yml ps
```

### Проверка API

```bash
curl -s http://127.0.0.1:8000/api/health
```

### Проверка фронтенда/HTTPS

```bash
ss -lntp | egrep ':80|:443' || true
curl -vk https://127.0.0.1/ 2>&1 | head -30
```

## Деплой

```bash
docker compose -f /root/brace__1/infra/docker-compose.prod.yml up -d --build backend
docker compose -f /root/brace__1/infra/docker-compose.prod.yml up -d --build frontend
```

## Логи

```bash
docker logs --tail=200 infra-backend-1
docker logs --tail=200 infra-frontend-1
docker logs --tail=200 infra-admin-bot-1
```

## Telegram webhook (проверка)

Не выводить токен. Задавать токены через переменные окружения.

```bash
TOKEN=$(grep -E '^BRACE_TELEGRAM_BOT_TOKEN=' /root/brace__1/.env | cut -d= -f2-)
curl -s "https://api.telegram.org/bot${TOKEN}/getWebhookInfo"
```

## Админ-бот

- Команды: `/start`, `/orders`, `/orders <status>`, `/order <id>`.
- Статусы для фильтра: `pending`, `processing`, `shipped`, `delivered`, `cancelled`.
- Кнопки в боте должны дублировать фильтры статусов и запускать `/orders <status>`.

## Типовые проблемы

### Backend unhealthy / миграции падают

Проверить логи backend, исправить ошибку, затем пересобрать:

```bash
docker logs --tail=200 infra-backend-1
docker compose -f /root/brace__1/infra/docker-compose.prod.yml up -d --build backend
```

### Нет ответа на команды бота

1) Проверить, что backend и admin-bot живы.
2) Проверить webhook/поллинг по логам и `getWebhookInfo`.
3) Проверить, что 80/443 слушаются на VPS.

```bash
docker compose -f /root/brace__1/infra/docker-compose.prod.yml ps
docker logs --tail=200 infra-admin-bot-1
```

## Коммиты на VPS

После исправления и проверки:

```bash
cd /root/brace__1
git status -sb
git add <files>
git commit -m "message"
git push
```
