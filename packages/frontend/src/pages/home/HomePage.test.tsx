import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { HomePage } from '@/pages/home/HomePage';
import { renderWithProviders } from '@/tests/renderWithProviders';

vi.mock('@/entities/product/api/productApi', () => ({
  productKeys: {
    list: () => ['products'],
    detail: (id: string) => ['products', id],
  },
  fetchProducts: vi.fn().mockResolvedValue({
    items: [
      {
        id: 'product-1',
        name: 'Test Product',
        description: 'desc',
        hero_media_url: null,
        created_at: '',
        updated_at: '',
        variants: [],
      },
    ],
    pagination: null,
  }),
}));

vi.mock('@/entities/banner/api/bannerApi', () => ({
  bannerKeys: {
    list: () => ['banners'],
  },
  fetchBanners: vi.fn().mockResolvedValue({
    banners: [
      {
        id: 'banner-1',
        image_url: 'https://cdn.test/banner-1.jpg',
        video_url: null,
        is_active: true,
        sort_order: 1,
      },
    ],
    active_index: 0,
  }),
}));

vi.mock('@/features/size-calculator/api/sizeCalcApi', () => ({
  calculateSize: vi.fn().mockResolvedValue({ size: 'M' }),
}));

describe('HomePage', () => {
  it('renders featured products', async () => {
    render(renderWithProviders(<HomePage />));

    await waitFor(() => {
      expect(screen.getAllByText('Test Product').length).toBeGreaterThan(0);
    });
  });
});
