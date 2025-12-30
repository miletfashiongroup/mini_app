import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppBottomNav, PageTopBar } from '@/components/brace';
import type { Order } from '@/entities/order/model/types';
import { useOrdersQuery } from '@/shared/api/queries';
import { formatPrice } from '@/shared/lib/money';
import { PageBlock } from '@/shared/ui';
import type { ApiError } from '@/shared/api/types';

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

const OrderCard = ({ order, onClick }: { order: Order; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-2xl border border-[#E6E6E9] bg-white px-4 py-3 text-left shadow-sm transition duration-150 ease-out hover:shadow-md"
  >
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
  </button>
);

export const OrdersPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useOrdersQuery();
  const orders = useMemo(() => data ?? [], [data]);
  const emptyError = isError && ((error as ApiError | undefined)?.status === 404 || (error as ApiError | undefined)?.type === 'not_found');

  const blocks = [
    {
      key: 'orders-list',
      title: 'Мои заказы',
      content: isLoading ? (
        <div className="text-[14px]">Загружаем заказы...</div>
      ) : isError && !emptyError ? (
        <div className="text-[14px]">Не удалось загрузить заказы.</div>
      ) : orders.length ? (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onClick={() => navigate(`/profile/orders/${order.id}`)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 text-[14px] text-[#5A5A5C]">
          <span>Заказов пока нет.</span>
          <button
            type="button"
            className="w-full rounded-2xl border border-[#000043] px-4 py-3 text-sm font-semibold text-[#000043]"
            onClick={() => navigate('/catalog')}
          >
            В каталог
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar showBack backFallback="/profile" />
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
