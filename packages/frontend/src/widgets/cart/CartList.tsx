import { useNavigate } from 'react-router-dom';

import type { CartItem } from '@/entities/cart/model/types';
import { CartItemCard } from '@/entities/cart/ui/CartItemCard';
import { RemoveCartItemButton } from '@/features/cart/remove-item/ui/RemoveCartItemButton';

type Props = {
  items: CartItem[];
};

export const CartList = ({ items }: Props) => {
  const navigate = useNavigate();
  if (!items.length) {
    return <p className="text-slate-400">Корзина пуста.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <CartItemCard
          key={item.id}
          item={item}
          actions={<RemoveCartItemButton itemId={item.id} />}
          onClick={() => {
            if (item.product_id) {
              navigate(`/product/${item.product_id}`);
            }
          }}
        />
      ))}
    </div>
  );
};
