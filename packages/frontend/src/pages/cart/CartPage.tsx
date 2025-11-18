import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchCart, cartKeys } from '@/entities/cart/api/cartApi';
import type { Order } from '@/entities/order/model/types';
import { CartList } from '@/widgets/cart/CartList';
import { CartSummary } from '@/widgets/cart/CartSummary';
import { formatPrice } from '@/shared/lib/money';
import { Skeleton } from '@/shared/ui/Skeleton';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useCreateOrderMutation } from '@/features/order/create-order/model/useCreateOrderMutation';
import { useToast } from '@/shared/hooks/useToast';

export const CartPage = () => {
  const toast = useToast();
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: cartKeys.all,
    queryFn: fetchCart,
  });
  const createOrder = useCreateOrderMutation();

  useEffect(() => {
    if (createOrder.isSuccess && createOrder.data) {
      setLastOrder(createOrder.data);
      toast.success(
        `Заказ #${createOrder.data.id} создан на сумму ${formatPrice(createOrder.data.total_minor_units)}.`,
      );
    }
  }, [createOrder.data, createOrder.isSuccess, toast]);

  const items = data?.items ?? [];
  const total = data?.total_minor_units ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Корзина</h1>
      {isError ? (
        <ErrorState
          message="Не удалось загрузить корзину. Обновите данные."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <CartList items={items} />
          <CartSummary
            totalMinorUnits={total}
            isDisabled={!items.length || createOrder.isPending}
            isLoading={createOrder.isPending}
            onCheckout={() => createOrder.mutate()}
          />
          {createOrder.isError && (
            <p className="text-sm text-red-300">
              {(createOrder.error as Error | undefined)?.message || 'Не удалось оформить заказ.'}
            </p>
          )}
          {lastOrder && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
              <p className="text-lg font-semibold">Последний заказ #{lastOrder.id}</p>
              <p className="text-sm text-slate-300">
                Сумма: <span className="font-semibold">{formatPrice(lastOrder.total_minor_units)}</span>
              </p>
              {lastOrder.shipping_address && (
                <p className="text-sm text-slate-300">Адрес: {lastOrder.shipping_address}</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};
