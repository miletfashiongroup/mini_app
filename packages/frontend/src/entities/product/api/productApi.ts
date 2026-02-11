import { apiClient } from '@/shared/api/httpClient';
import type { Pagination } from '@/shared/api/types';

import type { Product, ProductReview, ProductVariant } from '../model/types';

export type { Product, ProductVariant } from '../model/types';
export type { ProductReview } from '../model/types';

export const productKeys = {
  all: ['products'] as const,
  list: (params?: { page?: number; pageSize?: number; category?: string }) =>
    [
      ...productKeys.all,
      params?.page ?? 'all',
      params?.pageSize ?? 'all',
      params?.category ?? 'all',
    ] as const,
  detail: (productId: string) => [...productKeys.all, 'detail', productId] as const,
};

export type ProductListResult = {
  items: Product[];
  pagination: Pagination | null;
};

export type ProductReviewVotePayload = {
  vote: -1 | 0 | 1;
};

export type ProductReviewVoteResult = {
  review_id: string;
  helpful_count: number;
  not_helpful_count: number;
  user_vote: number;
};

export const fetchProducts = async (
  params?: { page?: number; pageSize?: number; category?: string },
): Promise<ProductListResult> => {
  const response = await apiClient.get<Product[]>('/products', {
    params: {
      page: params?.page,
      page_size: params?.pageSize,
      category: params?.category,
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

export const fetchRelatedProducts = async (productId: string): Promise<ProductListResult> => {
  const response = await apiClient.get<Product[]>(`/products/${productId}/related`);
  return {
    items: response.data,
    pagination: null,
  };
};

export const fetchProductReviews = async (productId: string): Promise<ProductReview[]> => {
  const response = await apiClient.get<ProductReview[]>(`/products/${productId}/reviews`);
  return response.data;
};

export const voteProductReview = async (
  reviewId: string,
  payload: ProductReviewVotePayload,
): Promise<ProductReviewVoteResult> => {
  const response = await apiClient.post<ProductReviewVoteResult>(`/products/reviews/${reviewId}/vote`, payload);
  return response.data;
};
