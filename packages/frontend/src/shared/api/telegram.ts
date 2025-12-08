import WebApp from '@twa-dev/sdk';

import { env } from '@/shared/config/env';

const resolveFromWindow = (): string => {
  if (typeof window === 'undefined') return '';
  const tg = (window as typeof window & { Telegram?: { WebApp?: typeof WebApp } }).Telegram?.WebApp;
  return tg?.initData || tg?.initDataUnsafe?.query_id || '';
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
  const sdkInitData = WebApp?.initData || '';
  const windowInitData = resolveFromWindow();
  const urlInitData = resolveFromUrl();
  const candidates = [sdkInitData, windowInitData, urlInitData].filter(Boolean) as string[];
  const fresh = candidates.find(isFresh);

  if (fresh) {
    return fresh;
  }

  if (env.env === 'production') {
    return '';
  }

  return env.devInitData || candidates[0] || '';
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
