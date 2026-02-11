import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppBottomNav, PageTopBar } from '@/components/brace';
import { useOrderQuery } from '@/shared/api/queries';
import { cancelOrder, orderKeys } from '@/entities/order/api/orderApi';
import { useToast } from '@/shared/hooks/useToast';
import { formatPrice } from '@/shared/lib/money';
import { PageBlock } from '@/shared/ui';

export const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useOrderQuery(orderId ?? '');
  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId ?? '') });
      toast.success('Заказ отменён');
    },
    onError: () => toast.error('Не удалось отменить заказ'),
  });

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar showBack backFallback="/profile/orders" />
      <div className="px-4 pb-4 pt-4">
        <h1 className="mt-2 text-[27px] font-bold leading-[1.1] text-[#29292B]">Заказ</h1>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6">
        <PageBlock title="Состав заказа">
          {isLoading ? (
            <div className="text-[14px]">Загружаем заказ...</div>
          ) : isError || !data ? (
            <div className="text-[14px]">Не удалось загрузить заказ.</div>
          ) : items.length ? (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#E6E6E9] bg-white px-4 py-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        item.product_id &&
                        navigate(`/product/${item.product_id}`, { state: { from: location.pathname } })
                      }
                      className={`h-14 w-14 rounded-xl border border-[#EFEFF2] bg-cover bg-center ${
                        item.hero_media_url ? '' : 'bg-[#F2F2F4]'
                      }`}
                      style={item.hero_media_url ? { backgroundImage: `url(${item.hero_media_url})` } : undefined}
                      aria-label="Открыть товар"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            item.product_id &&
                            navigate(`/product/${item.product_id}`, { state: { from: location.pathname } })
                          }
                          className="text-left text-[14px] font-semibold text-[#29292B]"
                        >
                          {item.product_name || item.product_code || item.product_id}
                        </button>
                        <span className="text-[13px] font-semibold text-[#29292B]">
                          {formatPrice((item.unit_price_minor_units ?? 0) * (item.quantity ?? 0))}
                        </span>
                      </div>
                      <div className="mt-2 text-[13px] text-[#5A5A5C]">
                        Размер {item.size ?? '—'} · {item.quantity ?? 0} шт.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[14px] text-[#5A5A5C]">В заказе нет товаров.</div>
          )}
        </PageBlock>
        {data ? (
          <PageBlock title="Итого">
            <div className="flex flex-col gap-2 text-[15px]">
              <div className="flex items-center justify-between">
                <span>Сумма</span>
                <span className="font-semibold text-[#29292B]">{formatPrice(data.total_minor_units)}</span>
              </div>
              {data.bonus_applied_minor_units ? (
                <div className="flex items-center justify-between text-[#5A5A5C]">
                  <span>Списано бонусами</span>
                  <span className="font-semibold text-[#29292B]">
                    -{formatPrice(data.bonus_applied_minor_units)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span>К оплате</span>
                <span className="font-semibold text-[#29292B]">
                  {formatPrice(data.payable_minor_units ?? data.total_minor_units)}
                </span>
              </div>
            </div>
          </PageBlock>
        ) : null}
        {data && data.status !== 'cancelled' ? (
          <button
            type="button"
            className="w-full rounded-2xl border border-[#E6E6E9] bg-white px-4 py-3 text-[14px] font-semibold text-[#29292B]"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            Отменить заказ
          </button>
        ) : null}
      </div>
      <AppBottomNav activeId="profile" />
    </div>
  );
};
