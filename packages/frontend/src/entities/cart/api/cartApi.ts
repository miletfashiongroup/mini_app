import { apiClient } from '@/shared/api/httpClient';

import type { CartCollection, CartItem, CartItemPayload } from '../model/types';

export type { CartCollection, CartItem, CartItemPayload } from '../model/types';

export const cartKeys = {
  all: ['cart'] as const,
};

export const fetchCart = async (): Promise<CartCollection> => {
  const response = await apiClient.get<CartCollection>('/cart');
  return response.data;
};

export const addCartItem = async (payload: CartItemPayload): Promise<CartItem> => {
  const response = await apiClient.post<CartItem>('/cart', payload);
  return response.data;
};

export const deleteCartItem = async (itemId: string): Promise<void> => {
  await apiClient.delete(`/cart/${itemId}`);
};
