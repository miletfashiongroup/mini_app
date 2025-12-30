import { useParams } from 'react-router-dom';

import { useProductDetails } from '@/pages/product/useProductDetails';
import { Skeleton } from '@/shared/ui/Skeleton';
import { BackButton } from '@/components/brace';

export const ProductDescriptionPage = () => {
  const { productId } = useParams();
  const { data: product, isLoading, isError } = useProductDetails(productId);
  const backFallback = productId ? `/product/${productId}` : '/catalog';

  if (isLoading) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-24 font-montserrat text-[#29292B]">
        <div className="px-4 pt-6">
          <BackButton iconOnly fallbackTo={backFallback} />
        </div>
        <div className="px-4 pt-4">
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-24 font-montserrat text-[#29292B]">
        <div className="px-4 pt-6">
          <BackButton iconOnly fallbackTo={backFallback} />
        </div>
        <p className="px-4 pt-4 text-red-300">Не удалось загрузить описание товара.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-24 font-montserrat text-[#29292B]">
      <div className="px-4 pt-6">
        <BackButton iconOnly fallbackTo={backFallback} />
      </div>
      <section className="space-y-4 px-4 pt-4">
        <h1 className="text-2xl font-semibold">Описание {product.name}</h1>
        <p className="text-slate-200 leading-relaxed">
          {product.description ??
            'Описания для этого товара ещё нет. Мы обновим страницу, как только появится больше информации.'}
        </p>
      </section>
    </div>
  );
};
