const normalizeUrl = (value?: string, fallback?: string) => {
  const result = (value || fallback || '').trim().replace(/\/+$/, '');
  return result || undefined;
};

const rawEnv = import.meta.env;
const mode = (rawEnv.VITE_ENV || rawEnv.MODE || 'dev').toLowerCase();

export const env = {
  env: mode,
  apiBaseUrl: normalizeUrl(
    rawEnv.VITE_API_BASE_URL || rawEnv.VITE_BACKEND_URL,
    typeof window !== undefined
      ? mode === production
        ? window.location.origin
        : http://localhost:8000
      : http://localhost:8000,
  ),
  appBaseUrl:
    normalizeUrl(rawEnv.VITE_APP_BASE_URL || rawEnv.VITE_APP_URL, 'http://localhost:4173') ||
    (typeof window !== 'undefined' ? window.location.origin : undefined),
  devInitData: rawEnv.VITE_DEV_INIT_DATA ?? '',
  telegramBotUsername: rawEnv.VITE_TELEGRAM_BOT_USERNAME ?? 'testing_brace_all_bot',
  analyticsEnabled: (rawEnv.VITE_ANALYTICS_ENABLED ?? 'true').toString() !== 'false',
  analyticsFlushIntervalMs: Number(rawEnv.VITE_ANALYTICS_FLUSH_INTERVAL_MS ?? '15000'),
  analyticsBatchSize: Number(rawEnv.VITE_ANALYTICS_BATCH_SIZE ?? '20'),
} as const;
