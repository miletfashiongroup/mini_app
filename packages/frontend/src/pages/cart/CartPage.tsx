import { useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import newBadgeIcon from '@/assets/images/icon-new.svg';
import { AppBottomNav, PageTopBar } from '@/components/brace';
import { cartKeys, deleteCartItem, updateCartItem } from '@/entities/cart/api/cartApi';
import type { CartCollection } from '@/entities/cart/model/types';
import { useCartQuery } from '@/shared/api/queries';

type CartItemView = {
  id: string;
  title: string;
  sizeLabel: string;
  quantity: number;
  unitPriceMinorUnits: number;
  isNew?: boolean;
  stockWarning?: string | null;
};

const rubleFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatRubles = (minorUnits: number) => rubleFormatter.format(minorUnits / 100);

const getItemCountLabel = (count: number) => {
  if (count === 1) return '1 товар';
  if (count >= 2 && count <= 4) return `${count} товара`;
  return `${count} товаров`;
};

const CartTitle = ({ itemCount }: { itemCount: number }) => (
  <div className="mt-2 mb-3 bg-white px-4">
    <div className="flex items-baseline gap-2">
      <span className="text-[26px] font-bold leading-[32px] text-[#29292B]">Корзина</span>
      <span className="text-[14px] font-medium leading-[18px] text-[#BABABA]">{getItemCountLabel(itemCount)}</span>
    </div>
  </div>
);

const CartItemsSection = ({ children }: { children: React.ReactNode }) => (
  <section className="w-full bg-[#D9D9D9] px-4 py-2">{children}</section>
);

const CartItemImagePlaceholder = ({ isNew }: { isNew?: boolean }) => (
  <div className="relative aspect-[3/4] w-full max-h-[280px] rounded-[12px] border border-black bg-white">
    {isNew ? <img src={newBadgeIcon} alt="Новинка" className="absolute left-2 top-2 h-4 w-auto" /> : null}
  </div>
);

const CartItemInfo = ({ title, sizeLabel }: { title: string; sizeLabel: string }) => (
  <div className="flex flex-col gap-1 pt-1">
    <p className="text-[18px] font-semibold leading-[22px] text-text-primary">{title}</p>
    <p className="text-[16px] leading-[20px] text-text-primary">{sizeLabel}</p>
  </div>
);

type CartItemQuantityControlsProps = {
  quantity: number;
  onDecrement?: () => void;
  onIncrement?: () => void;
};

const CartItemQuantityControls = ({ quantity, onDecrement, onIncrement }: CartItemQuantityControlsProps) => (
  <div className="mt-2 flex items-center gap-3">
    <button
      type="button"
      aria-label="Уменьшить количество"
      onClick={onDecrement}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6E6E6] text-[20px] font-bold text-[#29292B] transition duration-150 ease-out hover:bg-[#DCDCDC] active:scale-95"
    >
      -
    </button>
    <span className="text-[16px] font-medium text-[#29292B]">{quantity} шт.</span>
    <button
      type="button"
      aria-label="Увеличить количество"
      onClick={onIncrement}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6E6E6] text-[20px] font-bold text-[#29292B] transition duration-150 ease-out hover:bg-[#DCDCDC] active:scale-95"
    >
      +
    </button>
  </div>
);

const CartItemStockInfo = ({ message }: { message: string }) => (
  <p className="text-[12px] font-semibold text-[#FF0000]">{message}</p>
);

const CartItemPriceTag = ({ price }: { price: string }) => (
  <div className="inline-flex h-10 items-center justify-center rounded-[12px] bg-[#F4F4F8] px-6 text-[18px] font-bold text-[#29292B]">
    {price}
  </div>
);

const CartItemCard = ({
  item,
  onChangeQty,
  onRemove,
}: {
  item: CartItemView;
  onChangeQty: (nextQty: number) => void;
  onRemove: () => void;
}) => {
  const itemTotalMinorUnits = item.unitPriceMinorUnits * item.quantity;
  const itemTotalPrice = formatRubles(itemTotalMinorUnits);
  const canDecrease = item.quantity > 1;

  return (
    <article className="w-full rounded-[12px] bg-white p-3.5">
      <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-4">
        <CartItemImagePlaceholder isNew={item.isNew} />
        <div className="flex h-full flex-col gap-2">
          <CartItemInfo title={item.title} sizeLabel={item.sizeLabel} />
          <CartItemQuantityControls
            quantity={item.quantity}
            onDecrement={canDecrease ? () => onChangeQty(item.quantity - 1) : undefined}
            onIncrement={() => onChangeQty(item.quantity + 1)}
          />
          {item.stockWarning ? (
            <div className="mt-2">
              <CartItemStockInfo message={item.stockWarning} />
            </div>
          ) : null}
          <button
            type="button"
            className="self-start text-[12px] text-red-500 underline"
            onClick={onRemove}
          >
            удалить
          </button>
          <div className="mt-auto">
            <CartItemPriceTag price={itemTotalPrice} />
          </div>
        </div>
      </div>
    </article>
  );
};

const CartItemList = ({
  items,
  onChangeQty,
  onRemove,
}: {
  items: CartItemView[];
  onChangeQty: (id: string, nextQty: number) => void;
  onRemove: (id: string) => void;
}) => (
  <div className="space-y-3">
    {items.map((item) => (
      <CartItemCard
        key={item.id}
        item={item}
        onChangeQty={(qty) => onChangeQty(item.id, qty)}
        onRemove={() => onRemove(item.id)}
      />
    ))}
  </div>
);

const CartTotalRow = ({ totalLabel, totalPrice }: { totalLabel: string; totalPrice: string }) => (
  <div className="flex items-center justify-between px-4 pt-6">
    <span className="text-[20px] font-bold text-text-primary">{totalLabel}</span>
    <span className="text-[20px] font-bold text-text-primary">{totalPrice}</span>
  </div>
);

const CartCheckoutButton = ({ label }: { label: string }) => (
  <div className="px-4 pb-6 pt-6">
    <button
      type="button"
      className="flex h-14 w-full items-center justify-center rounded-[16px] bg-accent text-[16px] font-semibold text-white transition duration-150 ease-out hover:bg-[#00005A] active:scale-[0.97]"
    >
      {label}
    </button>
  </div>
);

const CartSummarySection = ({ totalPrice }: { totalPrice: string }) => (
  <section className="bg-white">
    <CartTotalRow totalLabel="Итого" totalPrice={totalPrice} />
    <CartCheckoutButton label="оформить заказ" />
  </section>
);

export const CartPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useCartQuery();

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => updateCartItem(id, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCartItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  });

  const cartItems: CartItemView[] =
    data?.items?.map((item: CartCollection['items'][number], index: number) => ({
      id: String(item.id ?? index),
      title: item.product_name ?? '—',
      sizeLabel: item.size ? String(item.size) : '—',
      quantity: item.quantity ?? 1,
      unitPriceMinorUnits: item.unit_price_minor_units ?? 0,
      isNew: true,
      stockWarning: item.stock_left === 1 ? 'Осталась 1 шт.' : null,
    })) ?? [];

  const totalMinorUnits = cartItems.reduce(
    (sum, item) => sum + item.unitPriceMinorUnits * item.quantity,
    0,
  );
  const totalPrice = formatRubles(totalMinorUnits);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar />
      <CartTitle itemCount={cartItems.length} />
      <CartItemsSection>
        {isLoading ? (
          <p className="px-2 py-4 text-[14px] text-[#29292B]">Загружаем корзину...</p>
        ) : isError ? (
          <p className="px-2 py-4 text-[14px] text-[#29292B]">Не удалось загрузить корзину.</p>
        ) : cartItems.length === 0 ? (
          <p className="px-2 py-4 text-[14px] text-[#29292B]">В корзине пока пусто.</p>
        ) : (
          <CartItemList
            items={cartItems}
            onChangeQty={(id, qty) => updateMutation.mutate({ id, quantity: qty })}
            onRemove={(id) => deleteMutation.mutate(id)}
          />
        )}
      </CartItemsSection>
      <CartSummarySection totalPrice={totalPrice} />
      <AppBottomNav activeId="cart" />
    </div>
  );
};
