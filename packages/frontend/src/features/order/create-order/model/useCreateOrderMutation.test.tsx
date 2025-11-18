import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useCreateOrderMutation } from '@/features/order/create-order/model/useCreateOrderMutation';
import type { Order } from '@/entities/order/model/types';
import { cartKeys } from '@/entities/cart/api/cartApi';
import { rest, server } from '@/tests/server';
import { createQueryClientWrapper } from '@/tests/queryClient';

const mockOrder: Order = {
  id: 'order-1',
  status: 'pending',
  total_minor_units: 2000,
  shipping_address: null,
  note: null,
  created_at: new Date().toISOString(),
  items: [],
};

describe('useCreateOrderMutation', () => {
  it('invalidates cart queries on success', async () => {
    // PRINCIPAL-FIX: MSW test
    server.use(
      rest.post('http://localhost/api/orders', (_req, res, ctx) =>
        res(ctx.json({ data: mockOrder, error: null })),
      ),
    );
    const { client, Wrapper } = createQueryClientWrapper();
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useCreateOrderMutation(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(spy).toHaveBeenCalledWith({ queryKey: cartKeys.all });
    expect(result.current.data).toEqual(mockOrder);
  });

  it('propagates API errors', async () => {
    server.use(
      rest.post('http://localhost/api/orders', (_req, res, ctx) =>
        res(ctx.status(500), ctx.json({ data: null, error: { type: 'internal', message: 'boom' } })),
      ),
    );
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useCreateOrderMutation(), { wrapper: Wrapper });

    await expect(result.current.mutateAsync()).rejects.toBeDefined();
  });
});
