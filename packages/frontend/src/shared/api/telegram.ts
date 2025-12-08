import WebApp from '@twa-dev/sdk';

import { env } from '@/shared/config/env';

const resolveFromWindow = (): string => {
  if (typeof window === 'undefined') return '';
  const tg = (window as typeof window & { Telegram?: { WebApp?: typeof WebApp } }).Telegram?.WebApp;
  return tg?.initData || '';
};

const extractRawQueryParam = (source: string, key: string): string => {
  if (!source) return '';
  const query = source.replace(/^[?#]/, '');
  const marker = `${key}=`;
  const start = query.indexOf(marker);
  if (start === -1) return '';
  return query.slice(start + marker.length);
};

const resolveFromUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const { search, hash, href } = window.location;
  const direct = extractRawQueryParam(search, 'tgWebAppData') || extractRawQueryParam(hash, 'tgWebAppData');
  if (direct) return direct;
  const fromHref = href.match(/tgWebAppData=([^#]+)/);
  return fromHref?.[1] ?? '';
};

const STORAGE_KEY = 'brace:twa:init-data';

const readFromStorage = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const writeToStorage = (value: string) => {
  if (typeof window === 'undefined' || !value) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
};

const extractAuthDate = (initData: string): number | undefined => {
  try {
    const params = new URLSearchParams(initData);
    const value = params.get('auth_date');
    if (!value) return undefined;
    const ts = Number(value);
    return Number.isFinite(ts) ? ts : undefined;
  } catch {
    return undefined;
  }
};

const isFresh = (initData: string): boolean => {
  if (!initData) return false;
  const authDate = extractAuthDate(initData);
  if (!authDate) return true;
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  return ageSeconds < 55 * 60; // slightly below backend limit (60m)
};

export const resolveTelegramInitData = (): string => {
  const sdkInitData = WebApp?.initData || resolveFromWindow();
  if (isFresh(sdkInitData)) {
    writeToStorage(sdkInitData);
    return sdkInitData;
  }

  const urlInitData = resolveFromUrl();
  if (isFresh(urlInitData)) {
    writeToStorage(urlInitData);
    return urlInitData;
  }

  const storedInitData = readFromStorage();
  if (isFresh(storedInitData)) {
    return storedInitData;
  }

  if (env.env !== 'production' && env.devInitData) {
    writeToStorage(env.devInitData);
    return env.devInitData;
  }

  return '';
};

const initialUrlData = typeof window !== 'undefined' ? resolveFromUrl() : '';
if (initialUrlData) {
  writeToStorage(initialUrlData);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const resolveTelegramInitDataAsync = async (timeoutMs = 1500, intervalMs = 50): Promise<string> => {
  let candidate = resolveTelegramInitData();
  const deadline = Date.now() + timeoutMs;

  while (!candidate && Date.now() < deadline) {
    await sleep(intervalMs);
    candidate = resolveTelegramInitData();
  }

  return candidate;
};

export const withTelegramInitData = async <T extends { headers?: Record<string, unknown> }>(config: T): Promise<T> => {
  const nextConfig = { ...config };
  const existingHeaders = nextConfig.headers ?? {};
  const initData = await resolveTelegramInitDataAsync();
  if (!initData && env.env !== 'production') {
    console.warn('Telegram init data is empty; requests may be rejected by backend.');
  }
  nextConfig.headers = {
    ...existingHeaders,
    'X-Telegram-Init-Data': initData || existingHeaders['X-Telegram-Init-Data'] || '',
  };
  return nextConfig;
};
