import { memo } from 'react';

import { formatPrice } from '@/shared/lib/money';

import type { CartItem } from '../model/types';

type Props = {
  item: CartItem;
  actions?: React.ReactNode;
  onClick?: () => void;
};

export const CartItemCard = memo(({ item, actions, onClick }: Props) => {
  const hasImage = Boolean(item.hero_media_url);
  const isClickable = Boolean(onClick);
  return (
    <div
      className={`bg-white/5 rounded-2xl p-3 flex gap-3 transition duration-150 ease-out ${
        isClickable ? 'cursor-pointer hover:bg-white/10' : ''
      }`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={`w-16 h-16 rounded-xl bg-cover bg-center border border-white/5 flex items-center justify-center text-[11px] text-slate-400 ${
          hasImage ? '' : 'bg-gradient-to-br from-slate-800 to-slate-900'
        }`}
        style={hasImage ? { backgroundImage: `url(${item.hero_media_url})` } : undefined}
      >
        {!hasImage && <span>Нет фото</span>}
      </div>
      <div className="flex-1">
        <h3 className="text-[15px] font-semibold">{item.product_name}</h3>
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
