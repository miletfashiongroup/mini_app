import WebApp from '@twa-dev/sdk';
import { nanoid } from 'nanoid';

import { resolveTelegramInitDataAsync } from '@/shared/api/telegram';
import { env } from '@/shared/config/env';

type AnalyticsEvent = {
  event_id: string;
  name: string;
  occurred_at: string;
  version: number;
  properties?: Record<string, unknown>;
  screen?: string;
};

type AnalyticsBatch = {
  schema_version: number;
  session_id: string;
  device_id: string | null;
  anon_id: string | null;
  context: Record<string, unknown>;
  events: AnalyticsEvent[];
};

type TrackerConfig = {
  enabled: boolean;
  flushIntervalMs: number;
  maxBatchSize: number;
  maxQueueSize: number;
};

const DEFAULT_CONFIG: TrackerConfig = {
  enabled: true,
  flushIntervalMs: 15_000,
  maxBatchSize: 20,
  maxQueueSize: 200,
};

const STORAGE_KEYS = {
  deviceId: 'brace:analytics:device_id',
  anonId: 'brace:analytics:anon_id',
  sessionId: 'brace:analytics:session_id',
  queue: 'brace:analytics:queue',
  firstOpen: 'brace:analytics:first_open',
};

let config: TrackerConfig = DEFAULT_CONFIG;
let isInitialized = false;
let queue: AnalyticsEvent[] = [];
let flushTimer: number | null = null;
let retryDelayMs = 2_000;
const MAX_RETRY_DELAY_MS = 60_000;

const nowIso = () => new Date().toISOString();

const safeStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const safeSessionStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
};

const getOrCreateId = (key: string, storage: Storage | null) => {
  if (!storage) return null;
  const existing = storage.getItem(key);
  if (existing) return existing;
  const value = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : nanoid();
  storage.setItem(key, value);
  return value;
};

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const toHex = (b: number) => b.toString(16).padStart(2, '0');
    return [
      bytes.slice(0, 4).map(toHex).join(''),
      bytes.slice(4, 6).map(toHex).join(''),
      bytes.slice(6, 8).map(toHex).join(''),
      bytes.slice(8, 10).map(toHex).join(''),
      bytes.slice(10, 16).map(toHex).join(''),
    ].join('-');
  }
  return nanoid();
};

const loadQueue = () => {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEYS.queue);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistQueue = () => {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.queue, JSON.stringify(queue));
  } catch {
    // ignore storage errors
  }
};

const getSessionId = () => getOrCreateId(STORAGE_KEYS.sessionId, safeSessionStorage());
const getDeviceId = () => getOrCreateId(STORAGE_KEYS.deviceId, safeStorage());
const getAnonId = () => getOrCreateId(STORAGE_KEYS.anonId, safeStorage());

const buildContext = () => {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initUnsafe = (WebApp as any)?.initDataUnsafe || {};
  return {
    app_version: (import.meta as any).env?.VITE_APP_VERSION || undefined,
    platform: WebApp?.platform || 'web',
    tg_client_version: WebApp?.version || undefined,
    locale: initUnsafe?.user?.language_code || (typeof navigator !== 'undefined' ? navigator.language : undefined),
    utm_source: params?.get('utm_source') || undefined,
    utm_medium: params?.get('utm_medium') || undefined,
    utm_campaign: params?.get('utm_campaign') || undefined,
    utm_content: params?.get('utm_content') || undefined,
    utm_term: params?.get('utm_term') || undefined,
    referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    start_param: initUnsafe?.start_param || undefined,
  };
};

const buildBatch = (events: AnalyticsEvent[]): AnalyticsBatch => ({
  schema_version: 1,
  session_id: getSessionId() || nanoid(),
  device_id: getDeviceId(),
  anon_id: getAnonId(),
  context: buildContext(),
  events,
});

const sendBatch = async (events: AnalyticsEvent[], useBeacon = false) => {
  if (!config.enabled || !events.length) return;
  const batch = buildBatch(events);
  const initData = await resolveTelegramInitDataAsync(2000);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
    headers.Authorization = `tma ${initData}`;
  }
  const body = JSON.stringify(batch);
  if (useBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    const ok = navigator.sendBeacon(`${env.apiBaseUrl}/api/analytics/events`, blob);
    if (!ok) {
      throw new Error('Analytics sendBeacon failed');
    }
    return;
  }
  const response = await fetch(`${env.apiBaseUrl}/api/analytics/events`, {
    method: 'POST',
    headers,
    body,
    keepalive: true,
  });
  if (!response.ok) {
    throw new Error(`Analytics ingest failed: ${response.status}`);
  }
};

const flushQueue = async (useBeacon = false) => {
  if (!queue.length) return;
  const batch = queue.slice(0, config.maxBatchSize);
  try {
    await sendBatch(batch, useBeacon);
    queue = queue.slice(batch.length);
    persistQueue();
    retryDelayMs = 2_000;
  } catch {
    retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
    scheduleFlush(retryDelayMs);
  }
};

const scheduleFlush = (delayMs: number) => {
  if (flushTimer) {
    window.clearTimeout(flushTimer);
  }
  flushTimer = window.setTimeout(() => void flushQueue(), delayMs);
};

export const initAnalytics = (override?: Partial<TrackerConfig>) => {
  if (isInitialized || typeof window === 'undefined') return;
  config = { ...DEFAULT_CONFIG, ...override };
  if (!config.enabled) return;

  queue = loadQueue();
  persistQueue();
  scheduleFlush(config.flushIntervalMs);

  window.addEventListener('online', () => void flushQueue());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushQueue(true);
    }
  });
  isInitialized = true;
};

export const trackEvent = (name: string, properties?: Record<string, unknown>, screen?: string) => {
  if (!config.enabled) return;
  const event: AnalyticsEvent = {
    event_id: generateUuid(),
    name,
    occurred_at: nowIso(),
    version: 1,
    properties,
    screen,
  };
  queue.push(event);
  if (queue.length > config.maxQueueSize) {
    queue = queue.slice(queue.length - config.maxQueueSize);
  }
  persistQueue();
  scheduleFlush(config.flushIntervalMs);
};

export const trackAppOpen = (screen: string) => {
  const storage = safeStorage();
  const hasOpened = storage?.getItem(STORAGE_KEYS.firstOpen);
  if (!hasOpened && storage) {
    storage.setItem(STORAGE_KEYS.firstOpen, '1');
  }
  trackEvent('app_open', { first_open: !hasOpened }, screen);
};

export const trackScreenView = (screen: string) => {
  trackEvent('screen_view', { screen }, screen);
  if (typeof window !== 'undefined' && typeof (window as any).ym === 'function') {
    const loc = window.location;
    const url = screen.startsWith('/') ? screen + loc.search + loc.hash : screen;
    (window as any).ym(106632112, 'hit', url, {
      title: typeof document !== 'undefined' ? document.title : undefined,
      referer: typeof document !== 'undefined' ? document.referrer : undefined,
    });
  }
};
