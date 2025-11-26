import type { Product } from '@/entities/product/model/types';
import { ProductCard } from '@/components/brace/ProductCard';

interface Props {
  products: Product[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

const SkeletonCard = () => (
  <div className="h-[420px] animate-pulse rounded-3xl border border-brace-surface bg-white/40" />
);

export const ProductGrid = ({ products, isLoading, isError, onRetry }: Props) => {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-brace-red300 bg-white/60 p-6 text-brace-red600">
        <p className="text-lg font-semibold">Не удалось загрузить товары</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-brace-black underline"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (!products.length) {
    return <p className="text-lg text-brace-neutral">Нет доступных товаров.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} isNew={index < 2} />
      ))}
    </div>
  );
};
