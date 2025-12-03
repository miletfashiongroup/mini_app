import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useProductsQuery, useProductQuery, useRelatedProductsQuery } from '@/shared/api/queries';
import { API_BASE_URL, HttpResponse, http, server } from '@/tests/server';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('product hooks', () => {
  it('fetches product list', async () => {
    server.use(
      http.get(`${API_BASE_URL}/products`, () =>
        HttpResponse.json({
          data: [
            { id: 'p1', name: 'Prod', variants: [], rating_value: 4.5, rating_count: 10, created_at: '', updated_at: '' },
          ],
          error: null,
          pagination: null,
        }),
      ),
    );
    const { result } = renderHook(() => useProductsQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
    expect(result.current.data?.items[0].id).toBe('p1');
  });

  it('fetches product detail', async () => {
    server.use(
      http.get(`${API_BASE_URL}/products/p1`, () =>
        HttpResponse.json({
          data: { id: 'p1', name: 'Prod', variants: [], rating_value: 4.5, rating_count: 10, created_at: '', updated_at: '' },
          error: null,
        }),
      ),
    );
    const { result } = renderHook(() => useProductQuery('p1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
    expect(result.current.data?.id).toBe('p1');
  });

  it('fetches related products', async () => {
    server.use(
      http.get(`${API_BASE_URL}/products/p1/related`, () =>
        HttpResponse.json({
          data: [],
          error: null,
        }),
      ),
    );
    const { result } = renderHook(() => useRelatedProductsQuery('p1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
    expect(result.current.data?.items).toEqual([]);
  });
});
