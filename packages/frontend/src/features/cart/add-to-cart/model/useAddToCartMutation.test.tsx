import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAddToCartMutation } from '@/features/cart/add-to-cart/model/useAddToCartMutation';
import { cartKeys } from '@/entities/cart/api/cartApi';
import { rest, server } from '@/tests/server';
import { createQueryClientWrapper } from '@/tests/queryClient';

const payload = {
  product_id: 'product-1',
  size: 'M',
  quantity: 1,
};

describe('useAddToCartMutation', () => {
  it('invalidates cart queries on success', async () => {
    // PRINCIPAL-FIX: MSW test
    server.use(
      rest.post('http://localhost/api/cart', (_req, res, ctx) =>
        res(
          ctx.json({
            data: {
              id: 'item-1',
              product_id: payload.product_id,
              product_name: 'Alpha',
              size: payload.size,
              quantity: payload.quantity,
              unit_price_minor_units: 1000,
              hero_media_url: null,
            },
            error: null,
          }),
        ),
      ),
    );
    const { client, Wrapper } = createQueryClientWrapper();
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useAddToCartMutation(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(spy).toHaveBeenCalledWith({ queryKey: cartKeys.all });
  });

  it('propagates API errors', async () => {
    server.use(
      rest.post('http://localhost/api/cart', (_req, res, ctx) =>
        res(ctx.status(500), ctx.json({ data: null, error: { type: 'internal', message: 'boom' } })),
      ),
    );
    const { Wrapper } = createQueryClientWrapper();
    const { result } = renderHook(() => useAddToCartMutation(), { wrapper: Wrapper });

    await expect(result.current.mutateAsync(payload)).rejects.toBeDefined();
  });
});
