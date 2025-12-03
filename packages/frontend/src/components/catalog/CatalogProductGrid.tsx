import { ProductCard, type ProductCardProps } from '@/shared/ui/ProductCard';

export type CatalogProduct = ProductCardProps;

type CatalogProductGridProps = {
  products: CatalogProduct[];
};

const CatalogProductGrid = ({ products }: CatalogProductGridProps) => {
  return (
    <div className="px-4 mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
};

export default CatalogProductGrid;
