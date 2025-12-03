import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as queries from '@/shared/api/queries';
import { renderWithProviders } from '@/tests/renderWithProviders';
import { ProductGrid } from '@/widgets/catalog/ProductGrid';

vi.mock('@/shared/api/queries', async (importOriginal) => {
  const mod = (await importOriginal()) as typeof queries;
  return {
    ...mod,
    useProductsQuery: vi.fn(),
  };
});

describe('ProductGrid', () => {
  it('renders products from the API', async () => {
    vi.mocked(queries.useProductsQuery).mockReturnValue({
      data: {
        items: [
          {
            id: 'product-1',
            name: 'Alpha Tee',
            description: 'Desc',
            hero_media_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            variants: [{ id: 'v1', size: 'M', price_minor_units: 3500, stock: 5 }],
          },
        ],
        pagination: null,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(renderWithProviders(<ProductGrid />));
    expect(await screen.findByText('Alpha Tee')).toBeInTheDocument();
  });

  it('shows error state when request fails', async () => {
    vi.mocked(queries.useProductsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as any);

    render(renderWithProviders(<ProductGrid />));
    expect(await screen.findByText(/Не удалось загрузить товары/)).toBeInTheDocument();
  });
});
