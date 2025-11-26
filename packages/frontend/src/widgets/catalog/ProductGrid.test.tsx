import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/tests/renderWithProviders';
import { HttpResponse, http, server } from '@/tests/server';
import { ProductGrid } from '@/widgets/catalog/ProductGrid';

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
      http.get('http://localhost/api/products', () =>
        HttpResponse.json({ data: productResponse, error: null }),
      ),
    );

    render(renderWithProviders(<ProductGrid />));
    expect(await screen.findByText('Alpha Tee')).toBeInTheDocument();
  });

  it('shows error state when request fails', async () => {
    server.use(
      http.get('http://localhost/api/products', () =>
        HttpResponse.json(
          { data: null, error: { type: 'internal', message: 'boom' } },
          { status: 500 },
        ),
      ),
    );

    render(renderWithProviders(<ProductGrid />));
    expect(await screen.findByText(/Не удалось загрузить каталог/)).toBeInTheDocument();
  });
});
