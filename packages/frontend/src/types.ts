export type Variant = {
  id: string;
  size: string;
  price: number;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  hero_media_url?: string;
  variants: Variant[];
};

export type CartResponseItem = {
  id: string;
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  hero_media_url?: string;
};

export type Order = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: {
    id: string;
    product_id: string;
    size: string;
    quantity: number;
    unit_price: number;
  }[];
};
