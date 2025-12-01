import React from 'react';

import arrowLeftIcon from '@/assets/images/icon-arrow-left.svg';
import logoBrace from '@/assets/images/logo-brace.svg';
import newBadgeIcon from '@/assets/images/icon-new.svg';
import CatalogBottomNavigation from '@/components/catalog/CatalogBottomNavigation';
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

const CartStatusBar = () => <div className="h-6 w-full bg-[#D9D9D9]" aria-hidden />;

const CartBackButton = () => (
  <button
    type="button"
    aria-label="Назад"
    onClick={() => window.history.back()}
    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#000043] transition duration-150 ease-out hover:brightness-105 active:scale-[0.96]"
  >
    <img src={arrowLeftIcon} alt="" className="h-5 w-5 invert" />
  </button>
);

const CartLogo = () => <img src={logoBrace} alt="BRACE logo" className="h-8 w-auto" />;

const CartHeader = () => (
  <header className="flex items-center justify-between bg-white px-4 py-4">
    <CartBackButton />
    <CartLogo />
  </header>
);

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
    <p className="text-[18px] font-semibold leading-[22px] text-[#29292B]">{title}</p>
    <p className="text-[16px] leading-[20px] text-[#29292B]">{sizeLabel}</p>
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

const CartItemCard = ({ item }: { item: CartItemView }) => {
  const itemTotalMinorUnits = item.unitPriceMinorUnits * item.quantity;
  const itemTotalPrice = formatRubles(itemTotalMinorUnits);

  return (
    <article className="w-full rounded-[12px] bg-white p-3.5">
      <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-4">
        <CartItemImagePlaceholder isNew={item.isNew} />
        <div className="flex h-full flex-col gap-2">
          <CartItemInfo title={item.title} sizeLabel={item.sizeLabel} />
          <CartItemQuantityControls quantity={item.quantity} />
          {item.stockWarning ? <div className="mt-2"><CartItemStockInfo message={item.stockWarning} /></div> : null}
          <div className="mt-auto">
            <CartItemPriceTag price={itemTotalPrice} />
          </div>
        </div>
      </div>
    </article>
  );
};

const CartItemList = ({ items }: { items: CartItemView[] }) => (
  <div className="space-y-3">
    {items.map((item) => (
      <CartItemCard key={item.id} item={item} />
    ))}
  </div>
);

const CartTotalRow = ({ totalLabel, totalPrice }: { totalLabel: string; totalPrice: string }) => (
  <div className="flex items-center justify-between px-4 pt-6">
    <span className="text-[20px] font-bold text-[#29292B]">{totalLabel}</span>
    <span className="text-[20px] font-bold text-[#29292B]">{totalPrice}</span>
  </div>
);

const CartCheckoutButton = ({ label }: { label: string }) => (
  <div className="px-4 pb-6 pt-6">
    <button
      type="button"
      className="flex h-14 w-full items-center justify-center rounded-[16px] bg-[#000043] text-[16px] font-semibold text-white transition duration-150 ease-out hover:bg-[#00005A] active:scale-[0.97]"
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
  const { data } = useCartQuery();

  const defaultItems: CartItemView[] = [
    {
      id: 'sample-1',
      title: 'Название',
      sizeLabel: '42-44',
      quantity: 1,
      unitPriceMinorUnits: 159100,
      isNew: true,
      stockWarning: 'Осталась 1 шт.',
    },
    {
      id: 'sample-2',
      title: 'Название',
      sizeLabel: '42-44',
      quantity: 1,
      unitPriceMinorUnits: 150000,
      isNew: true,
      stockWarning: null,
    },
  ];

  const cartItems: CartItemView[] =
    data?.items?.map((item, index) => ({
      id: String(item.id ?? index),
      title: item.product_name ?? 'Название',
      sizeLabel: item.size ? String(item.size) : '42-44',
      quantity: item.quantity ?? 1,
      unitPriceMinorUnits: item.unit_price_minor_units ?? 0,
      isNew: true,
      stockWarning: index === 0 ? 'Осталась 1 шт.' : null,
    })) ?? defaultItems;

  const totalMinorUnits = cartItems.reduce((sum, item) => sum + item.unitPriceMinorUnits * item.quantity, 0);
  const totalPrice = formatRubles(totalMinorUnits);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-[#29292B]">
      <CartStatusBar />
      <CartHeader />
      <CartTitle itemCount={cartItems.length} />
      <CartItemsSection>
        <CartItemList items={cartItems} />
      </CartItemsSection>
      <CartSummarySection totalPrice={totalPrice} />
      <CatalogBottomNavigation activeId="cart" />
    </div>
  );
};
