import { setupServer } from 'msw/node';
import { rest } from 'msw';

const defaultHandlers = [
  rest.get('http://localhost/api/health', (_req, res, ctx) =>
    res(ctx.json({ data: { ok: true }, error: null })),
  ),
];

export const server = setupServer(...defaultHandlers);

export { rest } from 'msw';
