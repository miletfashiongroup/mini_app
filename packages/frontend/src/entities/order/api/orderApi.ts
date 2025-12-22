import { apiClient } from '@/shared/api/httpClient';

import type { Order } from '../model/types';

export const orderKeys = {
  list: ['orders'] as const,
};

export const fetchOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>('/orders');
  return response.data ?? [];
};
