import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProductGrid } from '@/widgets/catalog/ProductGrid';
import { rest, server } from '@/tests/server';
import { renderWithProviders } from '@/tests/renderWithProviders';

const productResponse = {
  items: [
    {
      id: 'product-1',
      name: 'Alpha Tee',
      description: 'Desc',
      hero_media_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      variants: [
        { id: 'v1', size: 'M', price_minor_units: 3500, stock: 5 },
      ],
    },
  ],
  pagination: null,
};

describe('ProductGrid', () => {
  it('renders products from the API', async () => {
    // PRINCIPAL-FIX: MSW test
    server.use(
      rest.get('http://localhost/api/products', (_req, res, ctx) =>
        res(ctx.json({ data: productResponse, error: null })),
      ),
    );

    render(renderWithProviders(<ProductGrid />));
    expect(await screen.findByText('Alpha Tee')).toBeInTheDocument();
  });

  it('shows error state when request fails', async () => {
    server.use(
      rest.get('http://localhost/api/products', (_req, res, ctx) =>
        res(ctx.status(500), ctx.json({ data: null, error: { type: 'internal', message: 'boom' } })),
      ),
    );

    render(renderWithProviders(<ProductGrid />));
    expect(await screen.findByText(/Не удалось загрузить каталог/)).toBeInTheDocument();
  });
});
