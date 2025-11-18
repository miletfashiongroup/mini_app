import { Link } from 'react-router-dom';

import type { Product } from '@/entities/product/model/types';
import { ProductCard } from '@/entities/product/ui/ProductCard';
import { ProductCardSkeleton } from '@/entities/product/ui/ProductCardSkeleton';
import { useProductsQuery } from '@/shared/api/queries';
import { ErrorState } from '@/shared/ui/ErrorState';
import { MainScreenHero } from '@/widgets/home';

export const HomePage = () => {
  const { data, isLoading, isError, refetch } = useProductsQuery();

  const featured: Product[] = (data?.items ?? []).slice(0, 4);

  return (
    <section className="space-y-8">
      <MainScreenHero products={featured} />

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Популярные товары</h2>
          <Link to="/catalog" className="text-sm text-slate-300">
            Смотреть все →
          </Link>
        </div>
        {isLoading && (
          <div className="grid grid-flow-col auto-cols-[70%] gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        )}
        {isError && (
          <ErrorState
            message="Не удалось загрузить список товаров."
            onRetry={() => refetch()}
          />
        )}
        {!isLoading && !isError && (
          <div className="grid grid-flow-col auto-cols-[70%] gap-4 overflow-x-auto pb-2">
            {featured.length === 0 && <p className="text-slate-400">Нет товаров для отображения.</p>}
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
