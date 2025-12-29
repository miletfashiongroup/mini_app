import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ProductCard, type ProductCardProps } from '@/shared/ui/ProductCard';
import { useAddToCartMutation } from '@/features/cart/add-to-cart/model/useAddToCartMutation';
import { SizeSelectModal } from '@/features/cart/add-to-cart/ui/SizeSelectModal';
import { useToast } from '@/shared/hooks/useToast';
import { useFavoritesStore } from '@/shared/state/favoritesStore';

type ProductComplementSectionProps = {
  title?: string;
  products: (ProductCardProps & { sizes: string[] })[];
};

const ProductComplementSection = ({ title = 'Дополни образ', products }: ProductComplementSectionProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const addToCart = useAddToCartMutation();
  const favorites = useFavoritesStore((state) => state.items);
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const [activeProduct, setActiveProduct] = useState<(ProductCardProps & { sizes: string[] }) | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [favoriteProduct, setFavoriteProduct] = useState<(ProductCardProps & { sizes: string[] }) | null>(null);
  const [favoriteSize, setFavoriteSize] = useState('');
  const availableSizes = useMemo(() => activeProduct?.sizes ?? [], [activeProduct]);
  const favoriteSizes = useMemo(() => favoriteProduct?.sizes ?? [], [favoriteProduct]);

  const openSizeModal = (product: ProductCardProps & { sizes: string[] }) => {
    if (!product.sizes.length) {
      toast.error('Нет доступного размера для добавления.');
      return;
    }
    setActiveProduct(product);
    setSelectedSize(product.sizes[0] ?? '');
  };

  const closeSizeModal = () => {
    setActiveProduct(null);
    setSelectedSize('');
  };

  const isFavorite = (productId: string) => favorites.some((item) => item.id === productId);

  const openFavoriteModal = (product: ProductCardProps & { sizes: string[] }) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
      return;
    }
    if (!product.sizes.length) {
      toast.error('Нет доступного размера для добавления.');
      return;
    }
    setFavoriteProduct(product);
    setFavoriteSize(product.sizes[0] ?? '');
  };

  const closeFavoriteModal = () => {
    setFavoriteProduct(null);
    setFavoriteSize('');
  };
  return (
    <>
      <section className="px-4 mt-6">
        <h3 className="text-[20px] font-bold text-text-primary">{title}</h3>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              onClick={() => navigate(`/product/${product.id}`)}
              onAddToCart={() => openSizeModal(product)}
              onToggleFavorite={() => openFavoriteModal(product)}
              isFavorite={isFavorite(product.id)}
            />
          ))}
        </div>
      </section>
      <SizeSelectModal
        isOpen={Boolean(activeProduct)}
        sizes={availableSizes}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        onClose={closeSizeModal}
        onConfirm={() => {
          if (!activeProduct || !selectedSize) {
            toast.error('Выберите размер.');
            return;
          }
          addToCart.mutate(
            { product_id: activeProduct.id, size: selectedSize, quantity: 1 },
            {
              onError: (err: any) => toast.error(err?.message || 'Не удалось добавить в корзину.'),
              onSuccess: () => {
                toast.success('Товар добавлен в корзину');
                closeSizeModal();
              },
            },
          );
        }}
        isSubmitting={addToCart.isPending}
      />
      <SizeSelectModal
        isOpen={Boolean(favoriteProduct)}
        sizes={favoriteSizes}
        selectedSize={favoriteSize}
        onSelectSize={setFavoriteSize}
        onClose={closeFavoriteModal}
        title="Выберите размер для избранного"
        confirmLabel="Добавить в любимые"
        onConfirm={() => {
          if (!favoriteProduct || !favoriteSize) {
            toast.error('Выберите размер.');
            return;
          }
          addFavorite({
            id: favoriteProduct.id,
            tags: favoriteProduct.tags,
            price: favoriteProduct.price,
            ratingCount: favoriteProduct.ratingCount,
            ratingValue: favoriteProduct.ratingValue,
            isNew: favoriteProduct.isNew,
            imageUrl: favoriteProduct.imageUrl,
            defaultSize: favoriteProduct.defaultSize,
            size: favoriteSize,
          });
          closeFavoriteModal();
        }}
      />
    </>
  );
};

export default ProductComplementSection;
