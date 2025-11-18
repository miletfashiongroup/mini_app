import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

import { server } from '@/tests/server';

const webAppMock = {
  initData: '',
};

vi.mock('@twa-dev/sdk', () => ({
  default: webAppMock,
}));

window.__BRACE_ENV__ = { API_BASE_URL: 'http://localhost' };

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
