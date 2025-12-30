import { useParams } from 'react-router-dom';

import type { ProductVariant } from '@/entities/product/model/types';
import { useProductDetails } from '@/pages/product/useProductDetails';
import { formatPrice } from '@/shared/lib/money';
import { Skeleton } from '@/shared/ui/Skeleton';
import { BackButton } from '@/components/brace';

export const ProductSpecsPage = () => {
  const { productId } = useParams();
  const { data: product, isLoading, isError, refetch } = useProductDetails(productId);
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
        <div className="space-y-3 px-4 pt-4">
          <p className="text-red-300">Не удалось загрузить характеристики товара.</p>
          <button type="button" onClick={() => refetch()} className="text-sm text-[#000043] underline">
            Повторить
          </button>
        </div>
      </div>
    );
  }

  const variants: ProductVariant[] = product.variants ?? []; // PRINCIPAL-FIX: variants guard

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-24 font-montserrat text-[#29292B]">
      <div className="px-4 pt-6">
        <BackButton iconOnly fallbackTo={backFallback} />
      </div>
      <section className="space-y-4 px-4 pt-4">
        <h1 className="text-2xl font-semibold">Характеристики {product.name}</h1>
        <div className="overflow-hidden rounded-2xl border border-[#E6E6E9] bg-white">
          {variants.length ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F2F2F6] text-[#5A5A5C]">
                <tr>
                  <th className="p-3">Размер</th>
                  <th className="p-3">Цена</th>
                  <th className="p-3">Остаток</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.id} className="border-t border-[#EFEFF2]">
                    <td className="p-3">{variant.size}</td>
                    <td className="p-3">{formatPrice(variant.price_minor_units)}</td>
                    <td className="p-3">{variant.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-4 text-[#5A5A5C]">Нет доступных характеристик</p>
          )}
        </div>
      </section>
    </div>
  );
};
