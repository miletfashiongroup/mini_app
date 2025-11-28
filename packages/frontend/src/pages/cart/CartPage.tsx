import { useEffect, useState } from 'react';

import { Badge } from '@/components/brace';
import type { Order } from '@/entities/order/model/types';
import { useCreateOrderMutation } from '@/features/order/create-order/model/useCreateOrderMutation';
import { useCartQuery } from '@/shared/api/queries';
import { useToast } from '@/shared/hooks/useToast';
import { formatPrice } from '@/shared/lib/money';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Skeleton } from '@/shared/ui/Skeleton';
import { CartList } from '@/widgets/cart/CartList';
import { CartSummary } from '@/widgets/cart/CartSummary';

export const CartPage = () => {
  const toast = useToast();
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const { data, isLoading, isError, refetch } = useCartQuery();
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
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Badge color="bg-accent">Корзина</Badge>
        <h1 className="text-heading font-bold text-brace-zinc">Ваш заказ</h1>
        <p className="text-lg text-brace-neutral">Проверьте содержимое и оформите в мини приложении.</p>
      </div>

      {isError ? (
        <ErrorState message="Не удалось загрузить корзину. Обновите данные." onRetry={() => refetch()} />
      ) : (
        <>
          <div className="rounded-3xl border border-brace-surface bg-white/70 p-6">
            <CartList items={items} />
          </div>
          <div className="rounded-3xl border border-brace-black bg-brace-black/90 p-6 text-white">
            <CartSummary
              totalMinorUnits={total}
              isDisabled={!items.length || createOrder.isPending}
              isLoading={createOrder.isPending}
              onCheckout={() => createOrder.mutate()}
            />
            {createOrder.isError && (
              <p className="mt-3 text-sm text-brace-red300">
                {(createOrder.error as Error | undefined)?.message || 'Не удалось оформить заказ.'}
              </p>
            )}
          </div>
          {lastOrder && (
            <div className="space-y-2 rounded-3xl border border-brace-surface bg-white/70 p-6">
              <p className="text-lg font-semibold text-brace-zinc">Последний заказ #{lastOrder.id}</p>
              <p className="text-brace-neutral">
                Сумма: <span className="font-semibold text-brace-black">{formatPrice(lastOrder.total_minor_units)}</span>
              </p>
              {lastOrder.shipping_address && (
                <p className="text-brace-neutral">Адрес: {lastOrder.shipping_address}</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};
