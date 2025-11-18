import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AddToCartForm } from '@/features/cart/add-to-cart/ui/AddToCartForm';
import { useProductDetails } from '@/pages/product/useProductDetails';
import { formatPrice } from '@/shared/lib/money';
import { Skeleton } from '@/shared/ui/Skeleton';

export const ProductPage = () => {
  const { productId } = useParams();
  const { data: product, isLoading, isError, refetch } = useProductDetails(productId);

  const variants = product?.variants ?? []; // PRINCIPAL-FIX: variants guard
  const priceMinorUnits = useMemo(() => {
    if (!variants.length) {
      return null;
    }
    return variants[0]?.price_minor_units ?? null;
  }, [variants]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="space-y-3">
        <p className="text-red-300">Не удалось загрузить товар.</p>
        <button type="button" onClick={() => refetch()} className="text-sm text-white underline">
          Повторить
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div
        className="h-64 rounded-3xl bg-cover bg-center border border-white/10"
        style={{ backgroundImage: `url(${product.hero_media_url})` }}
      />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{product.name}</h1>
        <p className="text-slate-300">{product.description}</p>
        <p className="text-2xl font-semibold">
          {priceMinorUnits === null ? 'Нет в наличии' : formatPrice(priceMinorUnits)}
        </p>
      </div>

      <AddToCartForm product={product} />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Link to={`/product/${product.id}/description`} className="bg-white/5 rounded-2xl p-4">
          Описание →
        </Link>
        <Link to={`/product/${product.id}/specs`} className="bg-white/5 rounded-2xl p-4">
          Характеристики →
        </Link>
        <Link to="/size-table/men" className="bg-white/5 rounded-2xl p-4">
          Таблица размеров →
        </Link>
        <Link to="/coming-soon" className="bg-white/5 rounded-2xl p-4">
          Отзывы →
        </Link>
      </div>
    </section>
  );
};
