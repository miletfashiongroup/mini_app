import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

import { server } from '@/tests/server';

declare global {
  interface Window {
    __BRACE_ENV__?: {
      API_BASE_URL?: string;
      APP_URL?: string;
    };
  }
}

const webAppMock = {
  initData: '',
};

const TEST_RUNTIME_ENV = Object.freeze({
  API_BASE_URL: 'http://localhost:8000',
  APP_URL: 'http://localhost:4173',
});

const allowOverride = (value?: string) => {
  if (!value) {
    return true;
  }

  return value.includes('localhost') || value.includes('127.0.0.1');
};

if (typeof window !== 'undefined') {
  if (!window.__BRACE_ENV__ || allowOverride(window.__BRACE_ENV__.API_BASE_URL)) {
    window.__BRACE_ENV__ = {
      ...(window.__BRACE_ENV__ ?? {}),
      ...TEST_RUNTIME_ENV,
    };
  }
}

vi.mock('@twa-dev/sdk', () => ({
  default: webAppMock,
}));

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
