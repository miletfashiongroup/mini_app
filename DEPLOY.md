# Deployment Playbook

Reference deployment to free/low-cost services: Render (backend), Railway (PostgreSQL + Redis), and Vercel (frontend). Adapt as needed.

## 1. Provision Managed Services
1. **Railway PostgreSQL**
   - Create a project → Add PostgreSQL.
   - Copy connection string → set `BRACE_DATABASE_URL` (use the `postgresql+psycopg_async://` dialect; Alembic automatically swaps to the sync driver).
2. **Railway Redis**
   - Add Redis plugin, copy URL → `BRACE_REDIS_URL`.
3. **Render Backend Service**
   - New Web Service → point to GitHub repo.
   - Build command: `cd packages/backend && poetry install --no-root && poetry run alembic upgrade head`
   - Start command: `cd packages/backend && poetry run uvicorn brace_backend.main:app --host 0.0.0.0 --port 8000`
   - Environment: load `.env` values (see table below).
4. **Vercel Frontend**
   - Import repo → set root directory to `packages/frontend`.
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variables: `VITE_BACKEND_URL=https://<render-app>.onrender.com`, `VITE_APP_URL=https://<project>.vercel.app`.

## 2. Required Environment Variables
| Key | Location | Example |
| --- | --- | --- |
| `BRACE_TELEGRAM_BOT_TOKEN` | backend | `123456:ABCDEF` |
| `BRACE_DATABASE_URL` | backend | `postgresql+psycopg_async://user:pass@host:port/db` |
| `BRACE_REDIS_URL` | backend | `redis://default:pass@host:port/0` |
| `BRACE_CORS_ORIGINS` | backend | `["https://brace.vercel.app"]` |
| `BRACE_RATE_LIMIT` | backend | `120/minute` |
| `VITE_BACKEND_URL` | frontend | `https://brace-api.onrender.com` |
| `VITE_APP_URL` | frontend | `https://brace.vercel.app` |

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
- Redis: enable persistence (AOF) or accept ephemeral data.
- Store `.env` securely (1Password / Vault).

## 6. Rollback
1. Use Render “Rollback” to previous build.
2. Redeploy Vercel to previous deployment via dashboard.
3. Restore PostgreSQL snapshot if schema changes broke compatibility (aligned with Alembic migrations).
