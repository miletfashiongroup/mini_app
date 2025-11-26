import WebApp from '@twa-dev/sdk';
import { describe, expect, it } from 'vitest';

import { apiClient, parseApiEnvelope } from '@/shared/api/httpClient';
import { ApiError, type ApiEnvelope } from '@/shared/api/types';
import { env } from '@/shared/config/env';
import { HttpResponse, http, server } from '@/tests/server';

describe('httpClient parseApiEnvelope', () => {
  it('returns payload when data exists', () => {
    const envelope: ApiEnvelope<{ status: string }> = {
      data: { status: 'ok' },
      error: null,
      pagination: {
        page: 1,
        page_size: 20,
        total: 40,
        pages: 2,
      },
    };

    const parsed = parseApiEnvelope(envelope);
    expect(parsed.data.status).toBe('ok');
    expect(parsed.pagination?.total).toBe(40);
  });

  it('throws ApiError when backend error returned', () => {
    const envelope: ApiEnvelope<null> = {
      data: null,
      error: { type: 'validation_error', message: 'Bad data' },
      pagination: null,
    };

    expect(() => parseApiEnvelope(envelope)).toThrow(ApiError);
  });

  it('throws when data is null but no error', () => {
    const envelope: ApiEnvelope<null> = {
      data: null,
      error: null,
      pagination: null,
    };

    expect(() => parseApiEnvelope(envelope)).toThrowError('Empty response payload');
  });
});

describe('httpClient interceptors', () => {
  it('attaches Telegram init data header', async () => {
    // PRINCIPAL-FIX: MSW test
    WebApp.initData = 'telegram-init';
    let header: string | null = null;
    server.use(
      http.get('http://localhost/api/ping', ({ request }) => {
        header = request.headers.get('x-telegram-init-data');
        return HttpResponse.json({ data: { status: 'ok' }, error: null });
      }),
    );

    const response = await apiClient.get<{ status: string }>('/ping');

    expect(response.data.status).toBe('ok');
    expect(header).toBe('telegram-init');
  });

  it('redirects and throws friendly error on 401', async () => {
    window.location.href = 'http://localhost/original';
    server.use(
      http.get('http://localhost/api/ping', () =>
        HttpResponse.json(
          { data: null, error: { type: 'unauthorized', message: 'invalid session' } },
          { status: 401 },
        ),
      ),
    );

    await expect(apiClient.get<{ status: string }>('/ping')).rejects.toThrow(
      'Сессия Telegram истекла. Откройте мини-приложение заново.',
    );
    expect(window.__braceRedirectTarget__).toBe(env.appBaseUrl);
  });

  it('throws server friendly error on 5xx', async () => {
    server.use(
      http.get('http://localhost/api/ping', () =>
        HttpResponse.json({ data: null, error: null }, { status: 500 }),
      ),
    );

    await expect(apiClient.get<{ status: string }>('/ping')).rejects.toThrow(
      'Произошла ошибка сервера. Повторите попытку позже.',
    );
  });
});
