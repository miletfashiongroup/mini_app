import WebApp from '@twa-dev/sdk';

import { env } from '@/shared/config/env';

export const resolveTelegramInitData = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  const initData = WebApp.initData || '';
  // In production we must rely on real Telegram init data only.
  if (env.env === 'production') {
    return initData;
  }
  return initData || env.devInitData || '';
};

export const withTelegramInitData = <T extends { headers?: Record<string, unknown> }>(config: T): T => {
  const nextConfig = { ...config };
  const existingHeaders = nextConfig.headers ?? {};
  nextConfig.headers = {
    ...existingHeaders,
    'X-Telegram-Init-Data': resolveTelegramInitData(),
  };
  return nextConfig;
};
