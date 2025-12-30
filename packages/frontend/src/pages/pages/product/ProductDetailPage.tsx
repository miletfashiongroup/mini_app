import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import { SizeCalculator, Badge } from '@/components/brace';
import { AddToCartForm } from '@/features/cart/add-to-cart/ui/AddToCartForm';
import { useProductDetails } from '@/pages/product/useProductDetails';
import { formatPrice } from '@/shared/lib/money';
import { Skeleton } from '@/shared/ui/Skeleton';

export const ProductDetailPage = () => {
  const { productId } = useParams();
  const { data: product, isLoading, isError, refetch } = useProductDetails(productId);

  const variants = product?.variants ?? [];
  const priceMinorUnits = useMemo(() => {
    if (!variants.length) {
      return null;
    }
    return variants[0]?.price_minor_units ?? null;
  }, [variants]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="space-y-3 rounded-3xl border border-brace-red300 bg-brace-red300/10 p-6 text-brace-red600">
        <p className="text-lg font-semibold">Не удалось загрузить товар.</p>
        <button type="button" onClick={() => refetch()} className="text-sm font-medium underline">
          Повторить
        </button>
      </div>
    );
  }

  return (
    <article className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-brace-surface bg-brace-surface">
        {product.hero_media_url ? (
          <img src={product.hero_media_url} alt={product.name} className="h-[420px] w-full object-cover" />
        ) : (
          <div className="flex h-[420px] w-full items-center justify-center bg-gradient-to-br from-brace-slate to-brace-black text-white">
            <span className="text-5xl font-bold tracking-[0.5em]">BRACE</span>
          </div>
        )}
        <div className="absolute right-6 top-6 flex h-16 w-16 items-center justify-center rounded-full bg-brace-black text-white text-3xl">
          →
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.5fr,1fr]">
        <div className="space-y-6">
          <Badge color="bg-accent">коллекция</Badge>
          <div className="space-y-3">
            <h1 className="text-heading font-bold text-brace-zinc">{product.name}</h1>
            <p className="text-lg text-brace-neutral">{product.description}</p>
          </div>
          <p className="text-4xl font-semibold text-brace-black">
            {priceMinorUnits === null ? 'Нет в наличии' : formatPrice(priceMinorUnits)}
          </p>
          <AddToCartForm product={product} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to={`/product/${product.id}/description`} className="rounded-3xl border border-brace-surface bg-white/60 px-5 py-4 text-lg font-medium text-brace-zinc">
              Описание →
            </Link>
            <Link to={`/product/${product.id}/specs`} className="rounded-3xl border border-brace-surface bg-white/60 px-5 py-4 text-lg font-medium text-brace-zinc">
              Характеристики →
            </Link>
            <Link to="/size-table/men" className="rounded-3xl border border-brace-surface bg-white/60 px-5 py-4 text-lg font-medium text-brace-zinc">
              Таблица размеров →
            </Link>
            <Link to="/cart" className="rounded-3xl border border-brace-black bg-brace-black px-5 py-4 text-lg font-semibold text-white">
              Купить сейчас
            </Link>
          </div>
        </div>
        <div className="space-y-6">
          <SizeCalculator variant="compact" />
        </div>
      </div>
    </article>
  );
};
