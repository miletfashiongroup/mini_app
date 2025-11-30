import ProductComplementCard, { ProductComplementCardProps } from './ProductComplementCard';

type ProductComplementSectionProps = {
  title?: string;
  products: ProductComplementCardProps[];
};

const ProductComplementSection = ({ title = 'Дополни образ', products }: ProductComplementSectionProps) => {
  return (
    <section className="px-4 mt-6">
      <h3 className="text-[20px] font-bold text-[#29292B]">{title}</h3>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6">
        {products.map((product) => (
          <ProductComplementCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
};

export default ProductComplementSection;
