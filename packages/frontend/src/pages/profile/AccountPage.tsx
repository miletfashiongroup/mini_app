import { useMemo, useState } from 'react';

import { AppBottomNav, PageTopBar } from '@/components/brace';
import { useUserProfileQuery } from '@/shared/api/queries';
import { PageBlock } from '@/shared/ui';

type ProfileField = {
  label: string;
  value: string;
};

const Avatar = ({ name, username }: { name: string; username?: string }) => {
  const initials = useMemo(() => {
    const source = name || username || '';
    if (!source) return 'BR';
    const parts = source.replace('@', '').split(' ').filter(Boolean);
    const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
    return letters.join('') || 'BR';
  }, [name, username]);

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#000043] text-white">
      <span className="text-[22px] font-semibold">{initials}</span>
    </div>
  );
};

const ProfileFieldRow = ({
  label,
  value,
  pillWidth,
}: {
  label: string;
  value: string;
  pillWidth: string;
}) => (
  <div className="grid grid-cols-[minmax(0,1fr)_max-content] items-center gap-3">
    <span className="text-[14px] font-medium text-[#29292B]">{label}</span>
    <span
      className="inline-flex h-[30px] items-center justify-center rounded-full bg-white px-4 py-1.5 text-[14px] font-bold text-[#29292B] truncate"
      style={{ width: pillWidth, minWidth: '120px', maxWidth: '220px' }}
    >
      {value}
    </span>
  </div>
);

const buildProfileFields = (profile: any, name: string): ProfileField[] => {
  const fields: ProfileField[] = [];
  const idValue = profile?.telegram_id?.toString?.() || profile?.id || '';
  if (idValue) fields.push({ label: 'ID', value: idValue });
  if (name) fields.push({ label: 'Имя', value: name });
  if (profile?.username) fields.push({ label: 'Username', value: `@${profile.username}` });
  if (profile?.phone) fields.push({ label: 'Телефон', value: String(profile.phone) });
  if (profile?.email) fields.push({ label: 'Email', value: String(profile.email) });
  if (profile?.birth_date) fields.push({ label: 'Дата рождения', value: String(profile.birth_date) });
  if (profile?.gender) fields.push({ label: 'Пол', value: String(profile.gender) });
  return fields;
};

export const AccountPage = () => {
  const { data, isLoading, isError } = useUserProfileQuery();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditHint, setShowEditHint] = useState(false);

  const profileName =
    data?.full_name ||
    [data?.first_name, data?.last_name].filter(Boolean).join(' ').trim() ||
    '';

  const fields = useMemo(() => buildProfileFields(data, profileName), [data, profileName]);
  const pillWidth = useMemo(() => {
    const maxLen = fields.reduce((max, field) => Math.max(max, field.value.length), 0);
    const widthCh = Math.min(22, Math.max(10, maxLen));
    return `${widthCh}ch`;
  }, [fields]);

  const blocks = [
    {
      key: 'account-summary',
      content: (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={profileName} username={data?.username ?? ''} />
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
            <button
              type="button"
              className="h-12 w-full rounded-2xl bg-[#000043] text-[15px] font-semibold text-white transition duration-150 ease-out hover:bg-[#00005A] active:brightness-95"
              onClick={() => setShowEditHint(true)}
            >
              Редактировать данные
            </button>
            <button
              type="button"
              className="h-12 w-full rounded-2xl bg-[#D74242] text-[15px] font-semibold text-white transition duration-150 ease-out hover:bg-[#C53737] active:brightness-95"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Удалить аккаунт
            </button>
          </div>
          {showDeleteConfirm ? (
            <div className="rounded-2xl border border-[#E6E6E9] bg-white px-4 py-3 text-[13px] text-[#29292B]">
              <div className="font-semibold">Удаление аккаунта</div>
              <div className="mt-1 text-[#5A5A5C]">
                Чтобы удалить аккаунт, напишите в поддержку через Telegram бот.
              </div>
              <button
                type="button"
                className="mt-3 h-9 w-full rounded-xl bg-[#000043] text-[13px] font-semibold text-white"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Понятно
              </button>
            </div>
          ) : null}
          {showEditHint ? (
            <div className="rounded-2xl border border-[#E6E6E9] bg-white px-4 py-3 text-[13px] text-[#29292B]">
              <div className="font-semibold">Редактирование данных</div>
              <div className="mt-1 text-[#5A5A5C]">
                Для изменения профиля напишите в поддержку через Telegram бот.
              </div>
              <button
                type="button"
                className="mt-3 h-9 w-full rounded-xl bg-[#000043] text-[13px] font-semibold text-white"
                onClick={() => setShowEditHint(false)}
              >
                Понятно
              </button>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'account-data',
      title: 'Мои данные',
      content: fields.length ? (
        <div className="flex flex-col gap-3">
          {fields.map((field) => (
            <ProfileFieldRow key={field.label} label={field.label} value={field.value} pillWidth={pillWidth} />
          ))}
        </div>
      ) : (
        <div className="text-[14px] text-[#5A5A5C]">Пока нет данных профиля.</div>
      ),
    },
  ];

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar />
      <div className="px-4 pb-4 pt-4">
        <h1 className="text-[27px] font-bold leading-[1.1] text-[#29292B]">Мой аккаунт</h1>
      </div>
      {isLoading ? (
        <div className="px-4 py-6 text-[14px]">Загружаем профиль...</div>
      ) : isError ? (
        <div className="px-4 py-6 text-[14px]">Не удалось загрузить профиль.</div>
      ) : (
        <div className="flex flex-col gap-4 px-4 pb-6">
          {blocks.map((block) => (
            <PageBlock key={block.key} title={block.title}>
              {block.content}
            </PageBlock>
          ))}
        </div>
      )}
      <AppBottomNav activeId="profile" />
    </div>
  );
};
