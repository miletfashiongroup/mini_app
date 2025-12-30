import { apiClient } from '@/shared/api/httpClient';
import { ApiError } from '@/shared/api/types';

import type { Order } from '../model/types';

export const orderKeys = {
  list: ['orders'] as const,
  detail: (orderId: string) => ['orders', orderId] as const,
};

export const fetchOrders = async (): Promise<Order[]> => {
  try {
    const response = await apiClient.get<Order[]>('/orders');
    return response.data ?? [];
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404 || error.type === 'not_found') {
        return [];
      }
      if (error.status && error.status >= 500) {
        return [];
      }
    }
    throw error;
  }
};

export const fetchOrderById = async (orderId: string): Promise<Order> => {
  const response = await apiClient.get<Order>(`/orders/${orderId}`);
  return response.data;
};

export const cancelOrder = async (orderId: string): Promise<Order> => {
  const response = await apiClient.post<Order>(`/orders/${orderId}/cancel`);
  return response.data;
};
