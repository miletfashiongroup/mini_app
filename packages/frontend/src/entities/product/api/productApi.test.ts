import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/httpClient';

import { fetchProductById, fetchProducts } from './productApi';

vi.mock('@/shared/api/httpClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedGet = apiClient.get as unknown as ReturnType<typeof vi.fn>;

describe('productApi', () => {
  it('fetches products with pagination params', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [{ id: '1', name: 'Test', description: null, hero_media_url: null, created_at: '', updated_at: '', variants: [] }],
      pagination: { page: 2, page_size: 5, total: 10, pages: 2 },
    });

    const result = await fetchProducts({ page: 2, pageSize: 5 });

    expect(mockedGet).toHaveBeenCalledWith('/products', { params: { page: 2, page_size: 5 } });
    expect(result.items).toHaveLength(1);
    expect(result.pagination?.page).toBe(2);
  });

  it('fetches product by id', async () => {
    mockedGet.mockResolvedValueOnce({
      data: { id: '1', name: 'Test', description: null, hero_media_url: null, created_at: '', updated_at: '', variants: [] },
      pagination: null,
    });

    const result = await fetchProductById('1');
    expect(result.id).toBe('1');
  });
});
