import CatalogProductCard, { CatalogProductCardProps } from './CatalogProductCard';

export type CatalogProduct = CatalogProductCardProps;

type CatalogProductGridProps = {
  products: CatalogProduct[];
};

const CatalogProductGrid = ({ products }: CatalogProductGridProps) => {
  return (
    <div className="px-4 mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
      {products.map((product) => (
        <CatalogProductCard key={product.id} {...product} />
      ))}
    </div>
  );
};

export default CatalogProductGrid;
