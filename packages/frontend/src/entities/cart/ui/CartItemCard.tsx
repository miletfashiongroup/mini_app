import { memo } from 'react';

import { formatPrice } from '@/shared/lib/money';

import type { CartItem } from '../model/types';

type Props = {
  item: CartItem;
  actions?: React.ReactNode;
};

export const CartItemCard = memo(({ item, actions }: Props) => {
  const hasImage = Boolean(item.hero_media_url);
  return (
    <div className="bg-white/5 rounded-2xl p-4 flex gap-4">
      <div
        className={`w-20 h-20 rounded-xl bg-cover bg-center border border-white/5 flex items-center justify-center text-xs text-slate-400 ${
          hasImage ? '' : 'bg-gradient-to-br from-slate-800 to-slate-900'
        }`}
        style={hasImage ? { backgroundImage: `url(${item.hero_media_url})` } : undefined}
      >
        {!hasImage && <span>Нет фото</span>}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{item.product_name}</h3>
        <p className="text-sm text-slate-400">
          Размер {item.size} · {item.quantity} шт.
        </p>
        <p className="text-lg font-semibold">
          {formatPrice(item.quantity * item.unit_price_minor_units)}
        </p>
      </div>
      {actions}
    </div>
  );
});

CartItemCard.displayName = 'CartItemCard';
