import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useCartQuery } from '@/shared/api/queries';
import { API_BASE_URL, HttpResponse, http, server } from '@/tests/server';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useCartQuery', () => {
  it('fetches cart', async () => {
    server.use(
      http.get(`${API_BASE_URL}/cart`, () =>
        HttpResponse.json({
          data: {
            items: [
              {
                id: '1',
                product_id: 'p1',
                product_name: 'Prod',
                size: 'M',
                quantity: 1,
                unit_price_minor_units: 1000,
                hero_media_url: null,
              },
            ],
            total_minor_units: 1000,
          },
          error: null,
        }),
      ),
    );
    const { result } = renderHook(() => useCartQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
    expect(result.current.data?.items[0].product_name).toBe('Prod');
  });
});
