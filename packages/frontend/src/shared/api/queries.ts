import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import {
  type BannerCarouselResponse,
  bannerKeys,
  fetchBanners,
} from '@/entities/banner/api/bannerApi';
import { type CartCollection, cartKeys, fetchCart } from '@/entities/cart/api/cartApi';
import {
  type Product,
  type ProductListResult,
  fetchProductById,
  fetchProducts,
  productKeys,
} from '@/entities/product/api/productApi';
import { type UserProfile, fetchProfile, userKeys } from '@/entities/user/api/userApi';
import { ApiError } from '@/shared/api/types';

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, ApiError>,
  'queryKey' | 'queryFn' | 'initialData'
>;

export const useProductsQuery = (
  params?: { page?: number; pageSize?: number },
  options?: QueryOptions<ProductListResult>,
) =>
  useQuery<ProductListResult, ApiError>({
    queryKey: productKeys.list(params),
    queryFn: () => fetchProducts(params),
    ...options,
  });

export const useProductQuery = (
  productId: string,
  options?: QueryOptions<Product>,
) =>
  useQuery<Product, ApiError>({
    queryKey: productKeys.detail(productId),
    queryFn: () => fetchProductById(productId),
    enabled: Boolean(productId),
    ...options,
  });

export const useBannersQuery = (options?: QueryOptions<BannerCarouselResponse>) =>
  useQuery<BannerCarouselResponse, ApiError>({
    queryKey: bannerKeys.list(),
    queryFn: fetchBanners,
    staleTime: 5 * 60 * 1000,
    ...options,
  });

export const useCartQuery = (options?: QueryOptions<CartCollection>) =>
  useQuery<CartCollection, ApiError>({
    queryKey: cartKeys.all,
    queryFn: fetchCart,
    ...options,
  });

export const useUserProfileQuery = (options?: QueryOptions<UserProfile>) =>
  useQuery<UserProfile, ApiError>({
    queryKey: userKeys.profile,
    queryFn: fetchProfile,
    ...options,
  });

