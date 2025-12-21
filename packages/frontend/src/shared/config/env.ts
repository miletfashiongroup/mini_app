const normalizeUrl = (value?: string, fallback?: string) => {
  const result = (value || fallback || '').trim().replace(/\/+$/, '');
  return result || undefined;
};

const rawEnv = import.meta.env;
const mode = (rawEnv.VITE_ENV || rawEnv.MODE || 'dev').toLowerCase();

export const env = {
  env: mode,
  apiBaseUrl:
    normalizeUrl(
      rawEnv.VITE_API_BASE_URL || rawEnv.VITE_BACKEND_URL,
      'http://localhost:8000',
    ),
  appBaseUrl:
    normalizeUrl(rawEnv.VITE_APP_BASE_URL || rawEnv.VITE_APP_URL, 'http://localhost:4173') ||
    (typeof window !== 'undefined' ? window.location.origin : undefined),
  devInitData: rawEnv.VITE_DEV_INIT_DATA ?? '',
  telegramBotUsername: rawEnv.VITE_TELEGRAM_BOT_USERNAME ?? 'testing_brace_all_bot',
} as const;
