import { apiClient } from '@/shared/api/httpClient';

export type Banner = {
  id: string;
  image_url: string;
  video_url: string | null;
  is_active: boolean;
  sort_order: number;
};

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
