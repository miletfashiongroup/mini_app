// Temporary handcrafted types to unblock frontend builds/tests when OpenAPI
// generation is not available in CI. Replace with `pnpm generate:api` output
// once backend is reachable.

export interface components {
  schemas: {
    ProductVariant: {
      id: string;
      size: string;
      price_minor_units: number;
      stock?: number;
    };
    ProductRead: {
      id: string;
      name: string;
      description?: string | null;
      hero_media_url?: string | null;
      created_at: string;
      updated_at: string;
      tags?: string[];
      rating_value?: number | null;
      rating_count?: number | null;
      is_new?: boolean | null;
      specs?: string[];
      variants?: components['schemas']['ProductVariant'][];
    };
    CartItemRead: {
      id: string;
      product_id?: string;
      product_name?: string | null;
      size?: string | null;
      quantity?: number;
      unit_price_minor_units?: number;
      hero_media_url?: string | null;
      stock_left?: number | null;
    };
    CartCollection: {
      items: components['schemas']['CartItemRead'][];
      total_minor_units: number;
    };
    CartItemCreate: {
      product_id: string;
      size: string;
      quantity: number;
    };
    OrderItemRead: {
      id?: string;
      product_id?: string;
      size?: string;
      quantity?: number;
      unit_price_minor_units?: number;
    };
    OrderRead: {
      id: string;
      status: string;
      total_minor_units: number;
      shipping_address: string | null;
      note: string | null;
      created_at: string;
      items: components['schemas']['OrderItemRead'][];
    };
    BannerRead: {
      id: string;
      image_url: string;
      video_url?: string | null;
      is_active: boolean;
      sort_order: number;
    };
    UserProfile: {
      id?: string;
      username?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      language_code?: string | null;
    };
  };
}
