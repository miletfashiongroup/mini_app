import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const defaultHandlers = [
  http.get('http://localhost/api/health', () =>
    HttpResponse.json({ data: { ok: true }, error: null }),
  ),
];

export const server = setupServer(...defaultHandlers);

export { http, HttpResponse };
