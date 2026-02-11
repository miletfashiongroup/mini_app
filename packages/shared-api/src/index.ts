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
      product_code?: string | null;
      name: string;
      description?: string | null;
      hero_media_url?: string | null;
      created_at: string;
      updated_at: string;
      tags?: string[];
      rating_value?: number | null;
      rating_count?: number | null;
      is_new?: boolean | null;
      gallery?: string[];
      specs?: string[];
      variants?: components['schemas']['ProductVariant'][];
    };
    ProductReviewMediaRead: {
      id: string;
      url: string;
      sort_order: number;
      created_at: string;
    };
    ProductReviewRead: {
      id: string;
      product_id: string;
      rating: number;
      text: string;
      is_anonymous: boolean;
      status: string;
      created_at: string;
      updated_at: string;
      author_name: string;
      helpful_count?: number;
      not_helpful_count?: number;
      user_vote?: number;
      size_label?: string | null;
      purchase_date?: string | null;
      media?: components['schemas']['ProductReviewMediaRead'][];
    };
    ProductReviewVoteRequest: {
      vote: number;
    };
    ProductReviewVoteResponse: {
      review_id: string;
      helpful_count: number;
      not_helpful_count: number;
      user_vote: number;
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
      product_name?: string | null;
      product_code?: string | null;
      hero_media_url?: string | null;
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
      telegram_id?: number;
      username?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      language_code?: string | null;
      full_name?: string | null;
      phone?: string | null;
      email?: string | null;
      email_opt_out?: boolean | null;
      birth_date?: string | null;
      gender?: string | null;
      consent_given_at?: string | null;
      profile_completed_at?: string | null;
    };
  };
}
