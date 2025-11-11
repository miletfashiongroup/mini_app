import { create } from 'zustand';

export type CartItem = {
  id: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  price: number;
  hero?: string;
};

interface CartState {
  items: CartItem[];
  total: number;
  setItems: (items: CartItem[]) => void;
}

const useCartStore = create<CartState>((set) => ({
  items: [],
  total: 0,
  setItems: (items) =>
    set({
      items,
      total: items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    }),
}));

export default useCartStore;
