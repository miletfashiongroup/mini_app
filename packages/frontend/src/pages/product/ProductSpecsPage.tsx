import { Link, useParams } from 'react-router-dom';

import { useProductDetails } from '@/pages/product/useProductDetails';
import { formatPrice } from '@/shared/lib/money';
import { Skeleton } from '@/shared/ui/Skeleton';

export const ProductSpecsPage = () => {
  const { productId } = useParams();
  const { data: product, isLoading, isError, refetch } = useProductDetails(productId);

  if (isLoading) {
    return <Skeleton className="h-40 rounded-2xl" />;
  }

  if (isError || !product) {
    return (
      <div className="space-y-3">
        <p className="text-red-300">Не удалось загрузить характеристики товара.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm text-white underline"
        >
          Повторить
        </button>
      </div>
    );
  }

  const variants = product.variants ?? []; // PRINCIPAL-FIX: variants guard

  return (
    <section className="space-y-4">
      <Link to={`/product/${product.id}`} className="text-slate-300" type="button">
        ← Назад к товару
      </Link>
      <h1 className="text-2xl font-semibold">Характеристики {product.name}</h1>
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {variants.length ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="p-3">Размер</th>
                <th className="p-3">Цена</th>
                <th className="p-3">Остаток</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id} className="border-t border-white/10">
                  <td className="p-3">{variant.size}</td>
                  <td className="p-3">{formatPrice(variant.price_minor_units)}</td>
                  <td className="p-3">{variant.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-4 text-slate-300">Нет доступных характеристик</p>
        )}
      </div>
    </section>
  );
};
