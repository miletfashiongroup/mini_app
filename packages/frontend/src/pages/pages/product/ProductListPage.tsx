import { ProductGrid } from '@/components/brace';
import { useProductsQuery } from '@/shared/api/queries';

export const ProductListPage = () => {
  const { data, isLoading, isError, refetch } = useProductsQuery();
  const products = data?.items ?? [];

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.4em] text-brace-neutral">Каталог</p>
        <h1 className="text-heading font-bold text-brace-zinc">Ассортимент BRACE</h1>
        <p className="text-lg text-brace-neutral">
          Продукты собраны в сетку 1 → 2 → 3 колонки и адаптируются под Telegram WebApp.
        </p>
      </div>
      <ProductGrid products={products} isLoading={isLoading} isError={isError} onRetry={refetch} />
    </section>
  );
};
