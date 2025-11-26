import type { Product } from '@/entities/product/model/types';
import { formatPrice } from '@/shared/lib/money';

import { Badge } from './Badge';

type Props = {
  product: Product;
  isNew?: boolean;
};

const formatBadge = (isNew: boolean) => {
  if (isNew) {
    return <Badge>new</Badge>;
  }
  return null;
};

export const ProductCard = ({ product, isNew = false }: Props) => {
  const variants = product.variants ?? [];
  const isOutOfStock = variants.length === 0;
  const priceMinorUnits = variants[0]?.price_minor_units ?? null;
  const description = product.description ?? 'Модель BRACE с премиальными тканями.';

  return (
    <article
      className={`group relative flex flex-col rounded-3xl border border-brace-surface bg-white/70 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        isOutOfStock ? 'opacity-60' : ''
      }`}
    >
      {formatBadge(isNew)}
      <div className="mt-4 h-64 overflow-hidden rounded-3xl bg-brace-surface">
        {product.hero_media_url ? (
          <img
            src={product.hero_media_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brace-slate to-brace-black text-white">
            <span className="text-3xl font-bold tracking-[0.5em]">BR</span>
          </div>
        )}
      </div>
      <div className="mt-6 space-y-2">
        <p className="text-sm uppercase tracking-[0.5em] text-brace-neutral">brace</p>
        <h3 className="text-3xl font-semibold text-brace-zinc">{product.name}</h3>
        <p className="text-lg text-brace-neutral">{description}</p>
      </div>
      <div className="mt-6 flex items-center justify-between text-2xl font-semibold text-brace-zinc">
        {priceMinorUnits === null ? 'Нет в наличии' : formatPrice(priceMinorUnits)}
        <span className="text-3xl text-brace-black">→</span>
      </div>
    </article>
  );
};
