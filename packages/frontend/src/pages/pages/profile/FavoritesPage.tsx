import { useLocation, useNavigate } from 'react-router-dom';

import { AppBottomNav, PageTopBar } from '@/components/brace';
import { useAddToCartMutation } from '@/features/cart/add-to-cart/model/useAddToCartMutation';
import { useToast } from '@/shared/hooks/useToast';
import { useFavoritesStore } from '@/shared/state/favoritesStore';
import { ProductCard } from '@/shared/ui/ProductCard';

const FavoritesTitle = () => (
  <div className="px-4 pb-4 pt-4">
    <h1 className="text-[27px] font-bold leading-[1.1] text-[#29292B]">Любимые товары</h1>
  </div>
);

export const FavoritesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const addToCart = useAddToCartMutation();
  const favorites = useFavoritesStore((state) => state.items);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar showBack backFallback="/profile" />
      <FavoritesTitle />
      {favorites.length ? (
        <div className="px-4 mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
          {favorites.map((favorite) => (
            <ProductCard
              key={favorite.id}
              {...favorite}
              defaultSize={favorite.size}
              onClick={() => navigate(`/product/${favorite.id}`, { state: { from: location.pathname } })}
              onAddToCart={() => {
                if (!favorite.size) {
                  toast.error('Выберите размер.');
                  return;
                }
                addToCart.mutate(
                  { product_id: favorite.id, size: favorite.size, quantity: 1 },
                  {
                    onError: (err: any) => toast.error(err?.message || 'Не удалось добавить в корзину.'),
                    onSuccess: () => toast.success('Товар добавлен в корзину'),
                  },
                );
              }}
              isFavorite
              onToggleFavorite={() => removeFavorite(favorite.id)}
            />
          ))}
        </div>
      ) : (
        <p className="px-4 text-[14px]">Любимых товаров пока нет.</p>
      )}
      <AppBottomNav activeId="profile" />
    </div>
  );
};
