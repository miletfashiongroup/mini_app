import WebApp from '@twa-dev/sdk';

import { env } from '@/shared/config/env';

const resolveFromWindow = (): string => {
  if (typeof window === 'undefined') return '';
  const tg = (window as typeof window & { Telegram?: { WebApp?: typeof WebApp } }).Telegram?.WebApp;
  return tg?.initData || tg?.initDataUnsafe?.query_id || '';
};

export const resolveTelegramInitData = (): string => {
  const sdkInitData = WebApp?.initData || '';
  const windowInitData = resolveFromWindow();
  const initData = sdkInitData || windowInitData;

  if (env.env === 'production') {
    return initData;
  }
  return initData || env.devInitData || '';
};

export const withTelegramInitData = <T extends { headers?: Record<string, unknown> }>(config: T): T => {
  const nextConfig = { ...config };
  const existingHeaders = nextConfig.headers ?? {};
  const initData = resolveTelegramInitData();
  if (!initData) {
    console.warn('Telegram init data is empty; requests may be rejected by backend.');
  }
  nextConfig.headers = {
    ...existingHeaders,
    'X-Telegram-Init-Data': initData,
  };
  return nextConfig;
};
