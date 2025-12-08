import WebApp from '@twa-dev/sdk';
import { afterEach, describe, expect, it } from 'vitest';

import { resolveTelegramInitData } from './telegram';

const secondsAgo = (seconds: number) => Math.floor(Date.now() / 1000) - seconds;
const originalLocation = window.location;
const setLocation = (url: string) => {
  const newUrl = new URL(url);
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: newUrl,
  });
};

describe('resolveTelegramInitData', () => {
  afterEach(() => {
    WebApp.initData = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Telegram;
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('returns raw tgWebAppData without decoding it', () => {
    const rawInitData = 'query_id%3A123%26user%3Dabc%252525';
    setLocation(`http://localhost/?tgWebAppData=${rawInitData}`);

    expect(resolveTelegramInitData()).toBe(rawInitData);
  });

  it('ignores stale candidates and picks the freshest one available', () => {
    const stale = `auth_date=${secondsAgo(120 * 60)}&hash=old`;
    const fresh = `auth_date=${secondsAgo(60)}&hash=new`;
    WebApp.initData = stale;
    setLocation(`http://localhost/#tgWebAppData=${fresh}`);

    expect(resolveTelegramInitData()).toBe(fresh);
  });
});
