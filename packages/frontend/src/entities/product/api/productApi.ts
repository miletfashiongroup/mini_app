import { apiClient } from '@/shared/api/httpClient';
import type { Pagination } from '@/shared/api/types';

import type { Product } from '../model/types';

export const productKeys = {
  all: ['products'] as const,
  list: (params?: { page?: number; pageSize?: number }) =>
    [...productKeys.all, params?.page ?? 'all', params?.pageSize ?? 'all'] as const,
  detail: (productId: string) => [...productKeys.all, 'detail', productId] as const,
};

export type ProductListResult = {
  items: Product[];
  pagination: Pagination | null;
};

export const fetchProducts = async (
  params?: { page?: number; pageSize?: number },
): Promise<ProductListResult> => {
  const response = await apiClient.get<Product[]>('/products', {
    params: {
      page: params?.page,
      page_size: params?.pageSize,
    },
  });
  return {
    items: response.data,
    pagination: response.pagination ?? null,
  };
};

export const fetchProductById = async (productId: string): Promise<Product> => {
  const response = await apiClient.get<Product>(`/products/${productId}`);
  return response.data;
};
