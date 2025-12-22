import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import boxIcon from '@/assets/images/icon-box.svg';
import docsIcon from '@/assets/images/icon-docs.svg';
import giftIcon from '@/assets/images/icon-gift.svg';
import handsIcon from '@/assets/images/icon-hands.svg';
import profileAccountIcon from '@/assets/images/icon-profile_white.svg';
import supportIcon from '@/assets/images/icon-support.svg';
import { AppBottomNav, PageTopBar } from '@/components/brace';
import { useOrdersQuery, useUserProfileQuery } from '@/shared/api/queries';
import type { Order } from '@/entities/order/model/types';
import { formatPrice } from '@/shared/lib/money';

const ProfileTitle = () => (
  <div className="px-4 pb-4 pt-4">
    <h1 className="text-[27px] font-bold leading-[1.1] text-[#29292B]">Профиль</h1>
  </div>
);

const ProfileUserDataHeader = ({ title = 'Мои данные' }: { title?: string }) => (
  <h2 className="text-[18px] font-bold leading-[1.2] text-[#29292B]">{title}</h2>
);

type ProfileUserDataRowProps = {
  label: string;
  value: string;
};

const ProfileUserDataRow = ({ label, value }: ProfileUserDataRowProps) => (
  <div className="grid grid-cols-[minmax(0,1fr)_max-content] items-center gap-2">
    <span className="text-[14px] font-medium text-[#29292B]">{label}</span>
    <span className="inline-flex h-[30px] w-full max-w-[220px] items-center justify-center rounded-full bg-white px-4 py-1.5 text-[14px] font-bold text-[#29292B] truncate">
      {value}
    </span>
  </div>
);

type ProfileField = {
  label: string;
  value: string;
};

const ProfileUserDataSection = ({ fields }: { fields: ProfileField[] }) => (
  <section className="mt-0 w-full bg-[#D9D9D9] px-4 py-3">
    <ProfileUserDataHeader />
    <div className="mt-3 flex flex-col gap-2">
      {fields.map((field) => (
        <ProfileUserDataRow key={field.label} label={field.label} value={field.value} />
      ))}
    </div>
  </section>
);

const ProfileAvatar = ({
  name,
  username,
  size = 72,
}: {
  name: string;
  username?: string;
  size?: number;
}) => {
  const initials = useMemo(() => {
    const source = name || username || '';
    if (!source) return 'BR';
    const parts = source.replace('@', '').split(' ').filter(Boolean);
    const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
    return letters.join('') || 'BR';
  }, [name, username]);

  return (
    <div
      className="flex items-center justify-center rounded-full bg-[#000043] text-white"
      style={{ width: size, height: size }}
      aria-label="Аватар пользователя"
    >
      <span className="text-[20px] font-semibold">{initials}</span>
    </div>
  );
};

const ProfileActionButton = ({
  label,
  variant = 'primary',
  onClick,
}: {
  label: string;
  variant?: 'primary' | 'danger';
  onClick: () => void;
}) => (
  <button
    type="button"
    className={`h-12 w-full rounded-2xl text-[15px] font-semibold transition duration-150 ease-out ${
      variant === 'danger'
        ? 'bg-[#D74242] text-white hover:bg-[#C53737] active:brightness-95'
        : 'bg-[#000043] text-white hover:bg-[#00005A] active:brightness-95'
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

const ProfileSectionsHeader = () => (
  <h2 className="text-[20px] font-bold leading-[1.2] text-[#29292B]">Разделы</h2>
);

type ProfileSectionItemProps = {
  label: string;
  icon: string;
  onClick?: () => void;
  active?: boolean;
};

const ProfileSectionIcon = ({ icon }: { icon: string }) => (
  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#000043] text-white transition duration-150 ease-out group-hover:brightness-110 group-active:brightness-95">
    <img src={icon} alt="" className="h-6 w-7" />
  </div>
);

const ProfileSectionButton = ({ label, active }: { label: string; active?: boolean }) => (
  <span
    className={`flex h-12 flex-1 items-center justify-start rounded-2xl text-[16px] font-medium text-white transition duration-150 ease-out group-active:brightness-95 ${
      active ? 'bg-[#0B0B6B]' : 'bg-[#000043] group-hover:bg-[#00005A]'
    }`}
    style={{ paddingLeft: '40px', paddingRight: '12px', textAlign: 'left' }}
  >
    {label}
  </span>
);

const ProfileSectionItem = ({ label, icon, onClick, active }: ProfileSectionItemProps) => {
  return (
    <button
      type="button"
      aria-label={`Перейти: ${label}`}
      aria-pressed={active}
      className="group flex w-full items-center gap-3 bg-transparent px-0 py-0 transition duration-150 ease-out hover:brightness-105 active:scale-[0.97] cursor-pointer"
      onClick={onClick}
    >
      <ProfileSectionIcon icon={icon} />
      <ProfileSectionButton label={label} active={active} />
    </button>
  );
};

const ProfileSectionsSection = ({ items }: { items: ProfileSectionItemProps[] }) => (
  <section className="mt-1 w-full bg-white px-4 pb-10 pt-6">
    <ProfileSectionsHeader />
    <div className="mt-4 flex flex-col gap-3">
      {items.map((item) => (
        <ProfileSectionItem
          key={item.label}
          label={item.label}
          icon={item.icon}
          onClick={item.onClick}
          active={item.active}
        />
      ))}
    </div>
  </section>
);

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

export const ProfilePage = () => {
  const { data, isLoading, isError } = useUserProfileQuery();
  const { data: orders, isLoading: ordersLoading, isError: ordersError } = useOrdersQuery();
  const [activeSection, setActiveSection] = useState<'account' | 'orders'>('account');
  const navigate = useNavigate();

  const profileName =
    data?.full_name ||
    [data?.first_name, data?.last_name].filter(Boolean).join(' ').trim() ||
    '';
  const profileFields = useMemo<ProfileField[]>(() => {
    const fields: ProfileField[] = [];
    const idValue = (data as any)?.telegram_id?.toString?.() || data?.id || '';
    if (idValue) fields.push({ label: 'ID', value: idValue });
    if (profileName) fields.push({ label: 'Имя', value: profileName });
    if (data?.username) fields.push({ label: 'Username', value: `@${data.username}` });
    if ((data as any)?.phone) fields.push({ label: 'Телефон', value: String((data as any).phone) });
    if ((data as any)?.email) fields.push({ label: 'Email', value: String((data as any).email) });
    if ((data as any)?.birth_date)
      fields.push({ label: 'Дата рождения', value: String((data as any).birth_date) });
    if ((data as any)?.gender) fields.push({ label: 'Пол', value: String((data as any).gender) });
    return fields;
  }, [data, profileName]);

  const sections = useMemo<ProfileSectionItemProps[]>(
    () => [
      {
        label: 'мои заказы',
        icon: boxIcon,
        onClick: () => setActiveSection('orders'),
        active: activeSection === 'orders',
      },
      {
        label: 'мой аккаунт',
        icon: profileAccountIcon,
        onClick: () => setActiveSection('account'),
        active: activeSection === 'account',
      },
      { label: 'бонусная система', icon: giftIcon, onClick: () => navigate('/coming-soon') },
      { label: 'реферальная система', icon: handsIcon, onClick: () => navigate('/coming-soon') },
      { label: 'поддержка', icon: supportIcon, onClick: () => navigate('/coming-soon') },
      { label: 'юридические документы', icon: docsIcon, onClick: () => navigate('/coming-soon') },
    ],
    [navigate],
  );

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar />
      <ProfileTitle />
      {activeSection === 'account' ? (
        isLoading ? (
          <div className="px-4 py-6 text-[14px]">Загружаем профиль...</div>
        ) : isError ? (
          <div className="px-4 py-6 text-[14px]">Не удалось загрузить профиль.</div>
        ) : (
          <>
            <section className="px-4 pb-4">
              <div className="flex flex-col gap-4 rounded-3xl bg-[#F2F2F6] p-4">
                <div className="flex items-center gap-4">
                  <ProfileAvatar name={profileName} username={data?.username ?? ''} />
                  <div>
                    <div className="text-[16px] font-semibold text-[#29292B]">
                      {profileName || data?.username || 'Пользователь'}
                    </div>
                    {data?.username ? (
                      <div className="text-[13px] text-[#5A5A5C]">@{data.username}</div>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <ProfileActionButton
                    label="Редактировать данные"
                    onClick={() => navigate('/coming-soon')}
                  />
                  <ProfileActionButton
                    label="Удалить аккаунт"
                    variant="danger"
                    onClick={() => navigate('/coming-soon')}
                  />
                </div>
              </div>
            </section>
            {profileFields.length > 0 ? (
              <ProfileUserDataSection fields={profileFields} />
            ) : (
              <section className="mt-0 w-full bg-[#D9D9D9] px-4 py-3">
                <ProfileUserDataHeader />
                <div className="mt-3 text-[14px]">Пока нет данных профиля.</div>
              </section>
            )}
          </>
        )
      ) : (
        <section className="mt-0 w-full bg-[#D9D9D9] px-4 py-3">
          <ProfileUserDataHeader title="Мои заказы" />
          <div className="mt-3 flex flex-col gap-3">
            {ordersLoading ? (
              <div className="text-[14px]">Загружаем заказы...</div>
            ) : ordersError ? (
              <div className="text-[14px]">Не удалось загрузить заказы.</div>
            ) : orders && orders.length > 0 ? (
              orders.map((order) => <OrderCard key={order.id} order={order} />)
            ) : (
              <div className="text-[14px]">У вас пока нет заказов.</div>
            )}
          </div>
        </section>
      )}
      <ProfileSectionsSection items={sections} />
      <AppBottomNav activeId="profile" />
    </div>
  );
};
