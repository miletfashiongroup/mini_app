import { useQuery } from '@tanstack/react-query';

import { fetchProducts, productKeys } from '@/entities/product/api/productApi';
import type { Product } from '@/entities/product/model/types';
import { ProductCard } from '@/entities/product/ui/ProductCard';
import { ProductCardSkeleton } from '@/entities/product/ui/ProductCardSkeleton';
import { ErrorState } from '@/shared/ui/ErrorState';

export const ProductGrid = () => {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: productKeys.list(),
    queryFn: () => fetchProducts(),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <ProductCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="Не удалось загрузить каталог. Попробуйте обновить страницу."
        onRetry={() => refetch()}
      />
    );
  }

  const products = data?.items ?? [];

  if (!products.length) {
    return <p className="text-slate-400">Нет товаров для отображения.</p>;
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {products.map((product: Product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
