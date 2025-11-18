import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/routes';
import { fetchProductById } from '@/entities/product/api/productApi';
import { formatPrice } from '@/shared/lib/money';

vi.mock('@/entities/product/api/productApi');

const mockedFetchProductById = fetchProductById as unknown as vi.Mock;

const renderWithProviders = (initialEntries: string[]) => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('Product detail routes', () => {
  const product = {
    id: 'product-1',
    name: 'Test Product',
    description: 'Product description text',
    hero_media_url: null,
    created_at: '',
    updated_at: '',
    variants: [{ id: 'v1', size: 'M', price_minor_units: 10000, stock: 5 }],
  };

  it('renders description page', async () => {
    mockedFetchProductById.mockResolvedValueOnce(product);
    renderWithProviders(['/product/product-1/description']);

    expect(await screen.findByText(/Описание Test Product/i)).toBeInTheDocument();
    expect(screen.getByText(/Product description text/i)).toBeInTheDocument();
  });

  it('renders specs page', async () => {
    mockedFetchProductById.mockResolvedValueOnce(product);
    renderWithProviders(['/product/product-1/specs']);

    expect(await screen.findByText(/Характеристики Test Product/i)).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    const priceCells = screen.getAllByText(
      (_, element) => element?.textContent?.includes(formatPrice(10000)) ?? false,
    );
    expect(priceCells.length).toBeGreaterThan(0);
  });
});
