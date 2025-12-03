import type { components } from '@brace/shared-api';

import { apiClient } from '@/shared/api/httpClient';


export type Banner = components['schemas']['BannerRead'];

export type BannerCarouselResponse = {
  banners: Banner[];
  active_index: number;
};

export const bannerKeys = {
  list: () => ['banners'] as const,
};

export const fetchBanners = async (): Promise<BannerCarouselResponse> => {
  const response = await apiClient.get<BannerCarouselResponse>('/banners');
  return response.data;
};
