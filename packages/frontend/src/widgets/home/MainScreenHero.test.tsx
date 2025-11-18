import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/tests/renderWithProviders';
import { HttpResponse, http, server } from '@/tests/server';
import { MainScreenHero } from '@/widgets/home/MainScreenHero';

const products = [
  {
    id: 'product-1',
    name: 'Alpha Product',
    description: 'Desc',
    hero_media_url: null,
    created_at: '2024-09-19T00:00:00.000Z',
    updated_at: '2024-09-19T00:00:00.000Z',
    variants: [{ id: 'v1', size: 'M', price_minor_units: 10000, stock: 5 }],
  },
  {
    id: 'product-2',
    name: 'Beta Product',
    description: 'Desc',
    hero_media_url: null,
    created_at: '2024-09-19T00:00:00.000Z',
    updated_at: '2024-09-19T00:00:00.000Z',
    variants: [{ id: 'v2', size: 'L', price_minor_units: 15000, stock: 2 }],
  },
];

const banners = {
  banners: [
    {
      id: 'banner-1',
      image_url: 'https://cdn.test/banner-1.jpg',
      video_url: null,
      is_active: true,
      sort_order: 1,
    },
    {
      id: 'banner-2',
      image_url: 'https://cdn.test/banner-2.jpg',
      video_url: null,
      is_active: false,
      sort_order: 2,
    },
  ],
  active_index: 0,
};

const registerBannerHandler = () =>
  server.use(
    http.get('http://localhost/api/banners', () =>
      HttpResponse.json({ data: banners, error: null }),
    ),
  );

describe('MainScreenHero', () => {
  it('switches banners via controls', async () => {
    registerBannerHandler();
    render(renderWithProviders(<MainScreenHero products={products} />));

    const nextBtn = await screen.findByLabelText('Следующий баннер');
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('02')).toBeInTheDocument();
    });
  });

  it('submits size calculation form', async () => {
    registerBannerHandler();
    server.use(
      http.post('http://localhost/api/size/calc', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ waist: 90, hip: 100 });
        return HttpResponse.json({ data: { size: 'M' }, error: null });
      }),
    );

    render(renderWithProviders(<MainScreenHero products={products} />));

    fireEvent.change(await screen.findByPlaceholderText('Талия (см)'), { target: { value: '90' } });
    fireEvent.change(screen.getByPlaceholderText('Бедра (см)'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Рассчитать' }));

    await waitFor(() => {
      expect(screen.getByText('M')).toBeInTheDocument();
    });
  });
});

