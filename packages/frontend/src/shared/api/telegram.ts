import WebApp from '@twa-dev/sdk';

import { env } from '@/shared/config/env';

const resolveFromWindow = (): string => {
  if (typeof window === 'undefined') return '';
  const tg = (window as typeof window & { Telegram?: { WebApp?: typeof WebApp } }).Telegram?.WebApp;
  return tg?.initData || tg?.initDataUnsafe?.query_id || '';
};

const STORAGE_KEY = 'brace:last_init_data';

const readFromStorage = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const writeToStorage = (value: string) => {
  if (typeof window === 'undefined' || !value) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore storage failures
  }
};

const resolveFromUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return search.get('tgWebAppData') || hash.get('tgWebAppData') || '';
};

export const resolveTelegramInitData = (): string => {
  const sdkInitData = WebApp?.initData || '';
  const windowInitData = resolveFromWindow();
  const urlInitData = resolveFromUrl();
  const storedInitData = readFromStorage();

  const initData = sdkInitData || windowInitData || urlInitData || storedInitData;
  if (initData) {
    writeToStorage(initData);
  }

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
