import { useMutation, useQueryClient } from @tanstack/react-query;

import { cartKeys } from '@/entities/cart/api/cartApi';
import { orderKeys } from '@/entities/order/api/orderApi';
import type { Order } from '@/entities/order/model/types';
import { apiClient } from '@/shared/api/httpClient';

export type CreateOrderPayload = {
  bonus_minor_units?: number;
};

const createOrder = async (payload?: CreateOrderPayload): Promise<Order> => {
  const response = await apiClient.post<Order>(/orders, payload ?? {});
  return response.data;
};

export const useCreateOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.list });
    },
  });
};
