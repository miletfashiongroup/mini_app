import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ProductCard, type ProductCardProps } from '@/shared/ui/ProductCard';
import { useAddToCartMutation } from '@/features/cart/add-to-cart/model/useAddToCartMutation';
import { SizeSelectModal } from '@/features/cart/add-to-cart/ui/SizeSelectModal';
import { useToast } from '@/shared/hooks/useToast';

type ProductComplementSectionProps = {
  title?: string;
  products: (ProductCardProps & { sizes: string[] })[];
};

const ProductComplementSection = ({ title = 'Дополни образ', products }: ProductComplementSectionProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const addToCart = useAddToCartMutation();
  const [activeProduct, setActiveProduct] = useState<(ProductCardProps & { sizes: string[] }) | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const availableSizes = useMemo(() => activeProduct?.sizes ?? [], [activeProduct]);

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
    </>
  );
};

export default ProductComplementSection;
