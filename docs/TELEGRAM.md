# Telegram Mini App Integration

1. **Create a bot**
   - Talk to [@BotFather](https://t.me/BotFather)
   - Run `/newbot` → save `BOT_TOKEN` → set as `BRACE_TELEGRAM_BOT_TOKEN`

2. **Register the Mini App**
   - `/newapp` → choose the bot → set platform `webapp`
   - Provide `https://<FRONTEND_URL>` as the URL (Vercel/Render/etc.)
   - Optional start parameter: `brace`
   - `/setmenubutton` → web_app → same URL for quick access from bot menu

3. **Configure Domains**
   - `/setdomain` → `<FRONTEND_URL>` (must use HTTPS)
   - If backend domain differs, ensure it is reachable from the frontend and listed in `BRACE_CORS_ORIGINS`

4. **Environment Variables**
   | Variable | Source | Purpose |
   | --- | --- | --- |
   | `BRACE_TELEGRAM_BOT_TOKEN` | BotFather | Validate initData |
   | `VITE_APP_URL` | Deployment URL | WebApp root for Telegram |
   | `VITE_BACKEND_URL` | Backend host | API base for axios client |
   | `BRACE_CORS_ORIGINS` | Allowed origins | Restrict CORS to Telegram domains |

5. **Validation Endpoint**
   - `POST /api/verify-init` — send header `X-Telegram-Init-Data: <initData>`
   - Successful response: `{ "status": "verified", "telegram_id": "<id>" }`

6. **Manual QA Checklist**
   - Launch Mini App from the bot → open dev tools → confirm `initData` isn't empty
   - Add product to cart; backend logs should show `upsert_user`
   - Create order; ensure cart is cleared
   - Monitor Redis/DB for new entries

7. **Troubleshooting**
   - If you receive `Invalid signature`, double-check `BOT_TOKEN` and ensure there are no trailing spaces.
   - If `Init data expired`, confirm device clock accuracy and reduce proxy delays.
