import { useNavigate } from 'react-router-dom';

import { ProductCard, type ProductCardProps } from '@/shared/ui/ProductCard';

export type CatalogProduct = ProductCardProps;

type CatalogProductGridProps = {
  products: CatalogProduct[];
};

const CatalogProductGrid = ({ products }: CatalogProductGridProps) => {
  const navigate = useNavigate();

  return (
    <div className="px-4 mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          onClick={() => navigate(`/product/${product.id}`)}
          onAddToCart={() => navigate(`/product/${product.id}`)}
        />
      ))}
    </div>
  );
};

export default CatalogProductGrid;
