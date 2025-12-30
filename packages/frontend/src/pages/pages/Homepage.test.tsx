import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { Homepage } from '@/pages/Homepage';
import * as queries from '@/shared/api/queries';
import { renderWithProviders } from '@/tests/renderWithProviders';

vi.mock('@/shared/api/queries', async (importOriginal) => {
  const mod = (await importOriginal()) as typeof queries;
  return {
    ...mod,
    useBannersQuery: vi.fn(),
    useProductsQuery: vi.fn(),
  };
});

describe('Homepage', () => {
  it('renders key sections of the homepage design', () => {
    vi.mocked(queries.useBannersQuery).mockReturnValue({
      data: {
        banners: [{ id: 'b1', image_url: 'https://cdn.test/banner-1.jpg', is_active: true, sort_order: 1 }],
        active_index: 0,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
    vi.mocked(queries.useProductsQuery).mockReturnValue({
      data: {
        items: [
          { id: 'p1', is_new: true },
          { id: 'p2', is_new: false },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    render(renderWithProviders(<Homepage />));

    expect(screen.getByText('Заголовок 1.1')).toBeInTheDocument();
    expect(screen.getByText('Заголовок 1.2')).toBeInTheDocument();
    expect(screen.getByText('Баннер')).toBeInTheDocument();
  });
});
