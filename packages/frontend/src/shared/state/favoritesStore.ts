import { create } from 'zustand';

import type { ProductCardProps } from '@/shared/ui/ProductCard';

export type FavoriteItem = ProductCardProps & {
  size: string;
};

type FavoritesState = {
  items: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (productId: string) => void;
};

const STORAGE_KEY = 'brace:favorites';

const readFavorites = (): FavoriteItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeFavorites = (items: FavoriteItem[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const useFavoritesStore = create<FavoritesState>((set) => ({
  items: readFavorites(),
  addFavorite: (item) =>
    set((state) => {
      const existingIndex = state.items.findIndex((favorite) => favorite.id === item.id);
      const nextItems = existingIndex >= 0
        ? state.items.map((favorite) => (favorite.id === item.id ? { ...favorite, ...item } : favorite))
        : [...state.items, item];
      writeFavorites(nextItems);
      return { items: nextItems };
    }),
  removeFavorite: (productId) =>
    set((state) => {
      const nextItems = state.items.filter((favorite) => favorite.id !== productId);
      writeFavorites(nextItems);
      return { items: nextItems };
    }),
}));
