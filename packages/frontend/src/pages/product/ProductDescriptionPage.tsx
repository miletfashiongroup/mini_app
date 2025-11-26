import { Link, useParams } from 'react-router-dom';

import { useProductDetails } from '@/pages/product/useProductDetails';
import { Skeleton } from '@/shared/ui/Skeleton';

export const ProductDescriptionPage = () => {
  const { productId } = useParams();
  const { data: product, isLoading, isError } = useProductDetails(productId);

  if (isLoading) {
    return <Skeleton className="h-40 rounded-2xl" />;
  }

  if (isError || !product) {
    return <p className="text-red-300">Не удалось загрузить описание товара.</p>;
  }

  return (
    <section className="space-y-4">
      <Link to={`/product/${product.id}`} className="text-slate-300" type="button">
        ← Назад к товару
      </Link>
      <h1 className="text-2xl font-semibold">Описание {product.name}</h1>
      <p className="text-slate-200 leading-relaxed">
        {product.description ??
          'Описания для этого товара ещё нет. Мы обновим страницу, как только появится больше информации.'}
      </p>
    </section>
  );
};
