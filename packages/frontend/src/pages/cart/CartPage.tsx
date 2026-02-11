import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import newBadgeIcon from '@/assets/images/icon-new.svg';
import { AppBottomNav, PageTopBar } from '@/components/brace';
import { cartKeys, deleteCartItem, updateCartItem } from '@/entities/cart/api/cartApi';
import type { CartCollection } from '@/entities/cart/model/types';
import { useCreateOrderMutation } from '@/features/order/create-order/model/useCreateOrderMutation';
import { useCartQuery, useBonusBalance } from '@/shared/api/queries';
import { trackEvent } from '@/shared/analytics/tracker';

type CartItemView = {
  id: string;
  productId: string;
  title: string;
  sizeLabel: string;
  quantity: number;
  unitPriceMinorUnits: number;
  isNew?: boolean;
  stockWarning?: string | null;
  heroMediaUrl?: string | null;
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

const CartItemImage = ({
  src,
  isNew,
  onClick,
}: {
  src?: string | null;
  isNew?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative aspect-[3/4] w-full max-h-[280px] rounded-[12px] border border-black bg-white ${
      src ? 'bg-cover bg-center' : ''
    }`}
    style={src ? { backgroundImage: `url(${src})` } : undefined}
    aria-label="Открыть товар"
  >
    {isNew ? <img src={newBadgeIcon} alt="Новинка" className="absolute left-2 top-2 h-4 w-auto" /> : null}
  </button>
);

const CartItemInfo = ({ title, sizeLabel }: { title: string; sizeLabel: string }) => (
  <div className="flex flex-col gap-1 pt-1">
    <p className="text-[18px] font-semibold leading-[22px] text-text-primary">{title}</p>
    <p className="text-[16px] leading-[20px] text-text-primary">Размер: {sizeLabel}</p>
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
  onOpenProduct,
}: {
  item: CartItemView;
  onChangeQty: (nextQty: number) => void;
  onRemove: () => void;
  onOpenProduct: () => void;
}) => {
  const itemTotalMinorUnits = item.unitPriceMinorUnits * item.quantity;
  const itemTotalPrice = formatRubles(itemTotalMinorUnits);
  const canDecrease = item.quantity > 1;

  return (
    <article className="w-full rounded-[12px] bg-white p-3.5">
      <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-4">
        <CartItemImage src={item.heroMediaUrl} isNew={item.isNew} onClick={onOpenProduct} />
        <div className="flex h-full flex-col gap-2">
          <button type="button" onClick={onOpenProduct} className="text-left">
            <CartItemInfo title={item.title} sizeLabel={item.sizeLabel} />
          </button>
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
  onOpenProduct,
}: {
  items: CartItemView[];
  onChangeQty: (id: string, nextQty: number) => void;
  onRemove: (id: string) => void;
  onOpenProduct: (productId: string) => void;
}) => (
  <div className="space-y-3">
    {items.map((item) => (
      <CartItemCard
        key={item.id}
        item={item}
        onChangeQty={(qty) => onChangeQty(item.id, qty)}
        onRemove={() => onRemove(item.id)}
        onOpenProduct={() => onOpenProduct(item.productId)}
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

const CartCheckoutButton = ({
  label,
  disabled = false,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) => (
  <div className="px-4 pb-6 pt-6">
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-14 w-full items-center justify-center rounded-[16px] bg-accent text-[16px] font-semibold text-white transition duration-150 ease-out hover:bg-[#00005A] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
    >
      {label}
    </button>
  </div>
);

const CartSummarySection = ({
  totalPrice,
  onCheckout,
  disabled,
}: {
  totalPrice: string;
  onCheckout: () => void;
  disabled: boolean;
}) => (
  <section className="bg-white">
    <CartTotalRow totalLabel="Итого" totalPrice={totalPrice} />
    <CartCheckoutButton label="оформить заказ" onClick={onCheckout} disabled={disabled} />
  </section>
);

export const CartPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, isError } = useCartQuery();
  const [showOrderSent, setShowOrderSent] = useState(false);
  const createOrderMutation = useCreateOrderMutation();
  const cartTracked = useRef(false);

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
      productId: String(item.product_id ?? ''),
      title: item.product_name ?? '—',
      sizeLabel: item.size ? String(item.size) : '—',
      quantity: item.quantity ?? 1,
      unitPriceMinorUnits: item.unit_price_minor_units ?? 0,
      isNew: true,
      stockWarning: item.stock_left === 1 ? 'Осталась 1 шт.' : null,
      heroMediaUrl: item.hero_media_url ?? null,
    })) ?? [];

  const totalMinorUnits = cartItems.reduce(
    (sum, item) => sum + item.unitPriceMinorUnits * item.quantity,
    0,
  );
  const totalPrice = formatRubles(totalMinorUnits);
  const { data: bonusData } = useBonusBalance();
  const bonusBalance = bonusData?.balance ?? 0;
  const eligibleBonusMinorRaw = Math.min(bonusBalance * 100, Math.floor(totalMinorUnits / 2));
  const eligibleBonusMinor = Math.floor(eligibleBonusMinorRaw / 100) * 100;
  const [useBonus, setUseBonus] = useState(false);
  const bonusAppliedMinor = useBonus ? eligibleBonusMinor : 0;
  const payableMinorUnits = totalMinorUnits - bonusAppliedMinor;
  const payablePrice = formatRubles(payableMinorUnits);
  const isCheckoutDisabled = cartItems.length === 0 || createOrderMutation.isPending;

  useEffect(() => {
    if (!cartTracked.current && !isLoading && !isError) {
      trackEvent('cart_view', {
        cart_items: cartItems.length,
        cart_total_minor_units: totalMinorUnits,
        currency: 'RUB',
      }, '/cart');
      cartTracked.current = true;
    }
  }, [cartItems.length, isError, isLoading, totalMinorUnits]);

  const handleCheckout = () => {
    if (isCheckoutDisabled) return;
    trackEvent('checkout_start', {
      cart_items: cartItems.length,
      cart_total_minor_units: totalMinorUnits,
      currency: 'RUB',
    }, '/cart');
    createOrderMutation.mutate({ bonus_minor_units: bonusAppliedMinor }, {
      onSuccess: () => {
        setShowOrderSent(true);
      },
      onError: (err: any) => {
        trackEvent('order_failed', { error_code: err?.type || 'unknown' }, '/cart');
      },
    });
  };

  const handleOpenProduct = (productId: string) => {
    if (!productId) return;
    navigate(`/product/${productId}`, { state: { from: location.pathname } });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-24 font-montserrat text-text-primary relative">
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
            onChangeQty={(id, qty) => {
              const item = cartItems.find((entry) => entry.id === id);
              if (item) {
                trackEvent('cart_quantity_change', {
                  product_id: item.productId,
                  size: item.sizeLabel,
                  prev_quantity: item.quantity,
                  next_quantity: qty,
                }, '/cart');
              }
              updateMutation.mutate({ id, quantity: qty });
            }}
            onRemove={(id) => {
              const item = cartItems.find((entry) => entry.id === id);
              if (item) {
                trackEvent('cart_item_remove', {
                  product_id: item.productId,
                  size: item.sizeLabel,
                  quantity: item.quantity,
                }, '/cart');
              }
              deleteMutation.mutate(id);
            }}
            onOpenProduct={handleOpenProduct}
          />
        )}
      </CartItemsSection>
      <section className="bg-white">
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="text-[20px] font-bold text-text-primary">Сумма</span>
          <span className="text-[20px] font-bold text-text-primary">{totalPrice}</span>
        </div>
        {bonusBalance > 0 ? (
          <div className="flex items-center justify-between gap-3 px-4 pt-2">
            <span className="text-[14px] text-[#5A5A5C]">Доступно: {bonusBalance} баллов</span>
            <button
              type="button"
              onClick={() => setUseBonus((prev) => !prev)}
              className="rounded-xl border border-[#000043] px-3 py-2 text-[13px] font-semibold text-[#000043] transition hover:bg-[#000043] hover:text-white"
            >
              {useBonus ? 'Не списывать' : 'Списать баллы'}
            </button>
          </div>
        ) : null}
        {useBonus && bonusAppliedMinor > 0 ? (
          <div className="flex flex-col gap-1 px-4 pt-3 text-[14px]">
            <div className="flex items-center justify-between text-[#5A5A5C]">
              <span>Списано баллами</span>
              <span>-{formatRubles(bonusAppliedMinor)}</span>
            </div>
            <div className="flex items-center justify-between text-[18px] font-semibold text-text-primary">
              <span>К оплате</span>
              <span>{payablePrice}</span>
            </div>
          </div>
        ) : null}
        <CartCheckoutButton label="оформить заказ" onClick={handleCheckout} disabled={isCheckoutDisabled} />
      </section>
      <AppBottomNav activeId="cart" />
      {showOrderSent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <h3 className="text-[18px] font-bold text-[#29292B]">Заказ передан менеджеру</h3>
            <p className="mt-2 text-[14px] text-[#29292B]/80">
              Мы уже передали ваш заказ. Менеджер скоро свяжется с вами.
            </p>
            <button
              type="button"
              onClick={() => setShowOrderSent(false)}
              className="mt-5 w-full rounded-[12px] bg-[#000043] px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-[#00005A]"
            >
              Понятно
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
