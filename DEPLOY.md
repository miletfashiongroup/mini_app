# Deployment Playbook

Reference deployment to free/low-cost services: Render (backend), Railway (PostgreSQL), and Vercel (frontend). Adapt as needed.

## 1. Provision Managed Services

### 1.1 Render PostgreSQL (или другой managed PostgreSQL)
1. **Создайте PostgreSQL service в Render:**
   - Dashboard → New → PostgreSQL
   - Выберите план (free tier доступен)
   - Запишите **Internal Database URL** (не External!)

2. **Настройте connection string:**
   - Скопируйте Internal Database URL
   - Формат должен быть: `postgresql://user:pass@host:port/db`
   - Для backend используйте async версию: `postgresql+psycopg_async://...`
   - Alembic автоматически конвертирует в sync версию для миграций

### 1.2 Render Backend Service
1. **Создайте Web Service:**
   - Dashboard → New → Web Service
   - Подключите GitHub репозиторий
   - Root Directory: оставьте пустым (монорепо)

2. **Build Settings:**
   - Build Command: `cd packages/backend && poetry install --no-root && poetry run alembic upgrade head`
   - Start Command: `cd packages/backend && poetry run uvicorn brace_backend.main:app --host 0.0.0.0 --port $PORT`
   - Environment: Python 3.12

3. **Environment Variables:**
   - Настройте все required переменные (см. раздел 2)
   - Используйте Render Secrets для чувствительных данных

### 1.3 Render Frontend Service (или Vercel)
1. **Создайте Static Site в Render:**
   - Dashboard → New → Static Site
   - Подключите GitHub репозиторий
   - Root Directory: `packages/frontend`

2. **Build Settings:**
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `dist`

3. **Environment Variables:**
   - `VITE_BACKEND_URL` — URL вашего backend service
   - `VITE_APP_URL` — URL вашего frontend service

**Альтернатива:** Можно использовать Vercel для frontend (см. оригинальную инструкцию выше).

## 2. Required Environment Variables

### Backend (Render Backend Service)

#### 🔴 Required (Обязательные)
| Key | Description | Example |
| --- | --- | --- |
| `BRACE_TELEGRAM_BOT_TOKEN` | Telegram bot token от @BotFather | `123456:ABCDEF...` |
| `BRACE_DATABASE_URL` | PostgreSQL connection string (async driver) | `postgresql+psycopg_async://user:pass@host:port/db` |
| `BRACE_CORS_ORIGINS` | JSON array разрешенных origins | `["https://your-frontend.onrender.com"]` |
| `BRACE_ENVIRONMENT` | Окружение (production/staging/development) | `production` |

#### 🟡 Recommended (Рекомендуемые)
| Key | Description | Default | Example |
| --- | --- | --- | --- |
| `BRACE_REDIS_URL` | Redis URL для rate limiting | `memory://` | `redis://red-xxxxx:6379/0` |
| `BRACE_RATE_LIMIT` | Лимит запросов | `60/minute` | `120/minute` |
| `BRACE_LOG_LEVEL` | Уровень логирования | `INFO` | `INFO` |
| `BRACE_LOG_JSON` | JSON формат логов | `true` | `true` |

**Полный список переменных:** См. [ENV_VARIABLES.md](./ENV_VARIABLES.md) и [.env.example](./.env.example)

### Frontend (Render Frontend Service)

#### 🔴 Required (Обязательные)
| Key | Description | Example |
| --- | --- | --- |
| `VITE_BACKEND_URL` | Backend API URL | `https://your-backend.onrender.com` |
| `VITE_APP_URL` | Frontend App URL | `https://your-frontend.onrender.com` |

**Примечание:** Все переменные должны начинаться с `VITE_` для Vite build process.

## 3. GitHub Actions Secrets
| Secret | Purpose |
| --- | --- |
| `REGISTRY_USER`, `REGISTRY_TOKEN` | Optional Docker registry push |
| `RENDER_API_KEY` | Automate redeploy via Render API (deploy job) |
| `TELEGRAM_BOT_TOKEN` | Optional integration tests |

## 4. Deployment Workflow
1. Merge to `main` → GitHub Actions builds images (`ghcr.io/<org>/brace-backend`, `brace-frontend`).
2. Actions triggers Render deploy hook (if configured) to redeploy backend.
3. Vercel automatically redeploys frontend on push.
4. After deploy, run smoke tests:
   ```bash
   curl https://api.brace.app/api/health
   curl -H "X-Telegram-Init-Data: <signed-string>" https://api.brace.app/api/users/me
   ```

## 5. Disaster Recovery
- DB backups handled by Railway (enable daily snapshots).
- Store `.env` securely (1Password / Vault).

## 6. Rollback
1. Use Render "Rollback" to previous build.
2. Redeploy Vercel to previous deployment via dashboard.
3. Restore PostgreSQL snapshot if schema changes broke compatibility (aligned with Alembic migrations).

## 7. Additional Resources

- **[ENV_VARIABLES.md](./ENV_VARIABLES.md)** — Полная документация по всем environment variables
- **[.env.example](./.env.example)** — Шаблон .env файла с комментариями
- **[README.md](./README.md)** — Общая документация проекта
