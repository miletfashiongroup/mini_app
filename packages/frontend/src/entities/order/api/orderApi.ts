import { apiClient } from '@/shared/api/httpClient';

import type { Order } from '../model/types';

export const orderKeys = {
  list: ['orders'] as const,
  detail: (orderId: string) => ['orders', orderId] as const,
};

export const fetchOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>('/orders');
  return response.data ?? [];
};

export const fetchOrderById = async (orderId: string): Promise<Order> => {
  const response = await apiClient.get<Order>(`/orders/${orderId}`);
  return response.data;
};

export const cancelOrder = async (orderId: string): Promise<Order> => {
  const response = await apiClient.post<Order>(`/orders/${orderId}/cancel`);
  return response.data;
};
