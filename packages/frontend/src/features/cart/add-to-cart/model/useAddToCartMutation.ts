import { useMutation, useQueryClient } from '@tanstack/react-query';

import { addCartItem, cartKeys } from '@/entities/cart/api/cartApi';
import type { CartItemPayload } from '@/entities/cart/model/types';
import { trackEvent } from '@/shared/analytics/tracker';

export const useAddToCartMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CartItemPayload) => addCartItem(payload),
    onSuccess: (item, variables) => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      trackEvent('add_to_cart', {
        product_id: String(item.product_id ?? variables.product_id),
        size: item.size ?? variables.size,
        quantity: item.quantity ?? variables.quantity,
        price_minor_units: item.unit_price_minor_units ?? null,
        currency: 'RUB',
      });
    },
  });
};
