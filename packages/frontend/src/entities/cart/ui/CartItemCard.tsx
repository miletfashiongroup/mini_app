import { memo } from 'react';
import { Link } from 'react-router-dom';

import { formatPrice } from '@/shared/lib/money';

import type { CartItem } from '../model/types';

type Props = {
  item: CartItem;
  actions?: React.ReactNode;
  onClick?: () => void;
};

export const CartItemCard = memo(({ item, actions, onClick }: Props) => {
  const hasImage = Boolean(item.hero_media_url);
  const productLink = item.product_id ? `/product/${item.product_id}` : '';
  return (
    <div
      className="bg-white/5 rounded-2xl p-3 flex gap-3 transition duration-150 ease-out"
    >
      {productLink ? (
        <Link
          to={productLink}
          onClick={onClick}
          className={`w-16 h-16 rounded-xl bg-cover bg-center border border-white/5 ${
            hasImage ? '' : 'bg-gradient-to-br from-slate-800 to-slate-900'
          }`}
          style={hasImage ? { backgroundImage: `url(${item.hero_media_url})` } : undefined}
          aria-label="Открыть товар"
        />
      ) : (
        <div
          className={`w-16 h-16 rounded-xl bg-cover bg-center border border-white/5 ${
            hasImage ? '' : 'bg-gradient-to-br from-slate-800 to-slate-900'
          }`}
          style={hasImage ? { backgroundImage: `url(${item.hero_media_url})` } : undefined}
        />
      )}
      <div className="flex-1">
        {productLink ? (
          <Link
            to={productLink}
            onClick={onClick}
            className="text-left text-[15px] font-semibold"
          >
            {item.product_name}
          </Link>
        ) : (
          <div className="text-left text-[15px] font-semibold">{item.product_name}</div>
        )}
        <p className="text-[12px] text-slate-400">
          Размер {item.size ?? '—'} · {item.quantity ?? 0} шт.
        </p>
        <p className="text-[16px] font-semibold">
          {formatPrice((item.quantity ?? 0) * (item.unit_price_minor_units ?? 0))}
        </p>
      </div>
      {actions}
    </div>
  );
});

CartItemCard.displayName = 'CartItemCard';
