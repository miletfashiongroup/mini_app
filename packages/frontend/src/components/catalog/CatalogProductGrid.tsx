import { useNavigate } from 'react-router-dom';

import { ProductCard, type ProductCardProps } from '@/shared/ui/ProductCard';
import { useAddToCartMutation } from '@/features/cart/add-to-cart/model/useAddToCartMutation';
import { useToast } from '@/shared/hooks/useToast';

export type CatalogProduct = ProductCardProps;

type CatalogProductGridProps = {
  products: CatalogProduct[];
};

const CatalogProductGrid = ({ products }: CatalogProductGridProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const addToCart = useAddToCartMutation();

  return (
    <div className="px-4 mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          onClick={() => navigate(`/product/${product.id}`)}
          onAddToCart={() => {
            if (!product.defaultSize) {
              toast.error('Нет доступного размера для добавления.');
              return;
            }
            addToCart.mutate(
              { product_id: product.id, size: product.defaultSize, quantity: 1 },
              {
                onError: (err: any) => toast.error(err?.message || 'Не удалось добавить в корзину.'),
                onSuccess: () => toast.success('Товар добавлен в корзину'),
              },
            );
          }}
        />
      ))}
    </div>
  );
};

export default CatalogProductGrid;
