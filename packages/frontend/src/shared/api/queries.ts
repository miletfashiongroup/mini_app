import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import {
  type BannerCarouselResponse,
  bannerKeys,
  fetchBanners,
} from '@/entities/banner/api/bannerApi';
import { type CartCollection, cartKeys, fetchCart } from '@/entities/cart/api/cartApi';
import {
  type BonusBalance,
  type BonusLedgerEntry,
  bonusKeys,
  getBonusBalance,
  getBonusLedger,
} from '@/entities/bonus/api/bonusApi';
import {
  type Product,
  type ProductListResult,
  type ProductReview,
  fetchProductById,
  fetchProducts,
  productKeys,
  fetchRelatedProducts,
  fetchProductReviews,
} from '@/entities/product/api/productApi';
import { type ReferralStats, getReferralStats, referralKeys } from '@/entities/referral/api/referralApi';
import { type Order, fetchOrderById, fetchOrders, orderKeys } from '@/entities/order/api/orderApi';
import { type UserProfile, fetchProfile, userKeys } from '@/entities/user/api/userApi';
import { type SupportTicket, fetchSupportTickets } from '@/entities/support/api/supportApi';
import { type SupportMessage, fetchSupportMessages } from '@/entities/support/api/supportApi';
import { ApiError } from '@/shared/api/types';

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, ApiError>,
  'queryKey' | 'queryFn' | 'initialData'
>;

export const useProductsQuery = (
  params?: { page?: number; pageSize?: number; category?: string },
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

export const useRelatedProductsQuery = (
  productId: string,
  options?: QueryOptions<ProductListResult>,
) =>
  useQuery<ProductListResult, ApiError>({
    queryKey: [...productKeys.detail(productId), 'related'],
    queryFn: () => fetchRelatedProducts(productId),
    enabled: Boolean(productId),
    ...options,
  });

export const useProductReviewsQuery = (
  productId: string,
  options?: QueryOptions<ProductReview[]>,
) =>
  useQuery<ProductReview[], ApiError>({
    queryKey: [...productKeys.detail(productId), 'reviews'],
    queryFn: () => fetchProductReviews(productId),
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

export const useOrdersQuery = (options?: QueryOptions<Order[]>) =>
  useQuery<Order[], ApiError>({
    queryKey: orderKeys.list,
    queryFn: fetchOrders,
    ...options,
  });

export const useOrderQuery = (orderId: string, options?: QueryOptions<Order>) =>
  useQuery<Order, ApiError>({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => fetchOrderById(orderId),
    enabled: Boolean(orderId),
    ...options,
  });

export const useSupportTicketsQuery = (options?: QueryOptions<SupportTicket[]>) =>
  useQuery<SupportTicket[], ApiError>({
    queryKey: ['support', 'tickets'],
    queryFn: fetchSupportTickets,
    ...options,
  });

export const useBonusBalance = (options?: QueryOptions<BonusBalance>) =>
  useQuery<BonusBalance, ApiError>({
    queryKey: bonusKeys.balance,
    queryFn: getBonusBalance,
    ...options,
  });

export const useBonusLedgerQuery = (options?: QueryOptions<BonusLedgerEntry[]>) =>
  useQuery<BonusLedgerEntry[], ApiError>({
    queryKey: bonusKeys.ledger,
    queryFn: getBonusLedger,
    ...options,
  });

export const useReferral = (options?: QueryOptions<ReferralStats>) =>
  useQuery<ReferralStats, ApiError>({
    queryKey: referralKeys.my,
    queryFn: getReferralStats,
    ...options,
  });

export const useSupportMessagesQuery = (
  ticketId: string,
  options?: QueryOptions<SupportMessage[]>,
) =>
  useQuery<SupportMessage[], ApiError>({
    queryKey: ['support', 'tickets', ticketId, 'messages'],
    queryFn: () => fetchSupportMessages(ticketId),
    enabled: Boolean(ticketId),
    refetchInterval: 5000,
    ...options,
  });

