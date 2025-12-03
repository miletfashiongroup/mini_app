import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const API_BASE_URL = 'http://localhost:8000/api';

const defaultHandlers = [
  http.get(`${API_BASE_URL}/health`, () =>
    HttpResponse.json({ data: { ok: true }, error: null }),
  ),
  http.get(`${API_BASE_URL}/banners`, () =>
    HttpResponse.json({
      data: {
        banners: [
          { id: 'b1', image_url: 'https://cdn.test/banner-1.jpg', is_active: true, sort_order: 1 },
        ],
        active_index: 0,
      },
      error: null,
    }),
  ),
  http.get(`${API_BASE_URL}/products`, () =>
    HttpResponse.json({
      data: [
        {
          id: 'product-1',
          name: 'Alpha Tee',
          description: 'Desc',
          hero_media_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          variants: [{ id: 'v1', size: 'M', price_minor_units: 3500, stock: 5 }],
        },
      ],
      pagination: null,
      error: null,
    }),
  ),
  http.get(`${API_BASE_URL}/cart`, () =>
    HttpResponse.json({
      data: {
        items: [
          {
            id: 'cart-1',
            product_id: 'product-1',
            product_name: 'Alpha Tee',
            size: 'M',
            quantity: 1,
            unit_price_minor_units: 3500,
            hero_media_url: null,
          },
        ],
        total_minor_units: 3500,
      },
      error: null,
    }),
  ),
  http.post(`${API_BASE_URL}/cart`, async ({ request }) => {
    const body = (await request.json()) as { product_id: string; size: string; quantity: number };
    return HttpResponse.json({
      data: {
        id: 'cart-1',
        product_id: body.product_id,
        product_name: 'Alpha Tee',
        size: body.size,
        quantity: body.quantity,
        unit_price_minor_units: 3500,
        hero_media_url: null,
      },
      error: null,
    });
  }),
  http.post(`${API_BASE_URL}/orders`, () =>
    HttpResponse.json({
      data: {
        id: 'order-1',
        status: 'pending',
        total_minor_units: 3500,
        shipping_address: null,
        note: null,
        created_at: new Date().toISOString(),
        items: [],
      },
      error: null,
    }),
  ),
];

export const server = setupServer(...defaultHandlers);

export { http, HttpResponse };
