import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cartKeys } from "@/entities/cart/api/cartApi";
import { orderKeys } from "@/entities/order/api/orderApi";
import type { Order } from "@/entities/order/model/types";
import { apiClient } from "@/shared/api/httpClient";

const createOrder = async (): Promise<Order> => {
  const response = await apiClient.post<Order>("/orders", {});
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
