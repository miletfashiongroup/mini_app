import { useMemo } from 'react';

import { AppBottomNav, PageTopBar } from '@/components/brace';
import type { Order } from '@/entities/order/model/types';
import { useOrdersQuery } from '@/shared/api/queries';
import { formatPrice } from '@/shared/lib/money';
import { PageBlock } from '@/shared/ui';

const ORDER_STATUS_LABELS: Record<string, string> = {
  created: 'оформление',
  pending: 'оформление',
  processing: 'сборка',
  paid: 'сборка',
  shipped: 'отправка',
  delivered: 'доставлено',
  cancelled: 'отменено',
  refunded: 'возврат',
};

const formatOrderStage = (status?: string) => {
  if (!status) return 'статус не указан';
  const key = status.toLowerCase();
  return ORDER_STATUS_LABELS[key] || status;
};

const OrderCard = ({ order }: { order: Order }) => (
  <div className="rounded-2xl border border-[#E6E6E9] bg-white px-4 py-3 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14px] font-semibold text-[#29292B]">Заказ #{order.id.slice(0, 8)}</span>
      <span className="rounded-full bg-[#F2F2F6] px-3 py-1 text-[12px] font-semibold text-[#29292B]">
        {formatOrderStage(order.status)}
      </span>
    </div>
    <div className="mt-2 flex items-center justify-between text-[13px] text-[#5A5A5C]">
      <span>
        {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(order.created_at))}
      </span>
      <span className="font-semibold text-[#29292B]">{formatPrice(order.total_minor_units)}</span>
    </div>
  </div>
);

export const OrdersPage = () => {
  const { data, isLoading, isError } = useOrdersQuery();
  const orders = useMemo(() => data ?? [], [data]);

  const blocks = [
    {
      key: 'orders-list',
      title: 'Мои заказы',
      content: isLoading ? (
        <div className="text-[14px]">Загружаем заказы...</div>
      ) : isError ? (
        <div className="text-[14px]">Не удалось загрузить заказы.</div>
      ) : orders.length ? (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="text-[14px] text-[#5A5A5C]">У вас пока нет заказов.</div>
      ),
    },
  ];

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar />
      <div className="px-4 pb-4 pt-4">
        <h1 className="text-[27px] font-bold leading-[1.1] text-[#29292B]">Мои заказы</h1>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6">
        {blocks.map((block) => (
          <PageBlock key={block.key} title={block.title}>
            {block.content}
          </PageBlock>
        ))}
      </div>
      <AppBottomNav activeId="profile" />
    </div>
  );
};
