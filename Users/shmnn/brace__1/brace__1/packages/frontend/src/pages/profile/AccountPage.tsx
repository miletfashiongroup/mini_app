import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import WebApp from '@twa-dev/sdk';

import { AppBottomNav, PageTopBar } from '@/components/brace';
import { useUserProfileQuery } from '@/shared/api/queries';
import { env } from '@/shared/config/env';
import { PageBlock } from '@/shared/ui';
import { deleteProfile, submitConsent, updateProfile } from '@/entities/user/api/userApi';

type ProfileField = {
  label: string;
  value: string;
};

const CONSENT_TEXT = 'Я соглашаюсь на обработку персональных данных.';
const SKIP_KEY = 'brace_profile_skip';
const ANALYTICS_KEYS = [
  'brace:analytics:device_id',
  'brace:analytics:anon_id',
  'brace:analytics:session_id',
  'brace:analytics:queue',
  'brace:analytics:first_open',
];

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
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useUserProfileQuery();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);

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

  useEffect(() => {
    if (!data) return;
    setFullName(data.full_name || [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || '');
    setBirthDate(data.birth_date ? String(data.birth_date) : '');
    setGender((data.gender as 'male' | 'female' | undefined) || '');
    setEmail(data.email || '');
    setConsent(Boolean(data.consent_given_at));
  }, [data]);

  const openBot = () => {
    const botLink = `https://t.me/${env.telegramBotUsername}`;
    if (typeof WebApp?.openTelegramLink === 'function') {
      WebApp.openTelegramLink(botLink);
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(botLink, '_blank');
    }
  };

  const consentMutation = useMutation({
    mutationFn: () => submitConsent({ consent: true, consent_text: CONSENT_TEXT }),
  });

  const profileMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        full_name: fullName,
        phone: data?.phone ?? '',
        email: email.trim() ? email.trim() : null,
        birth_date: birthDate,
        gender: gender || 'male',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditError(null);
      setShowEditForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProfile(),
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SKIP_KEY);
        ANALYTICS_KEYS.forEach((key) => localStorage.removeItem(key));
        sessionStorage.removeItem('brace:analytics:session_id');
        window.location.href = window.location.origin;
      }
    },
  });

  const handleEditSubmit = async () => {
    setEditError(null);
    if (!consent) {
      setEditError('Нужно согласиться на обработку данных.');
      return;
    }
    if (!data?.phone) {
      setEditError('Сначала поделитесь номером телефона в боте.');
      return;
    }
    if (!fullName.trim() || !birthDate || !gender) {
      setEditError('Заполните все обязательные поля.');
      return;
    }
    try {
      if (!data?.consent_given_at) {
        await consentMutation.mutateAsync();
      }
      await profileMutation.mutateAsync();
    } catch (err: any) {
      setEditError(err?.message || 'Не удалось сохранить профиль.');
    }
  };

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
              onClick={() => setShowEditForm(true)}
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
                Все данные будут удалены без возможности восстановления, включая заказы и историю.
              </div>
              <label className="mt-3 flex items-start gap-2 text-[12px] text-[#29292B]/80">
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={(e) => setDeleteConfirmed(e.target.checked)}
                  className="mt-1"
                />
                <span>Я понимаю последствия и хочу удалить аккаунт</span>
              </label>
              <button
                type="button"
                className="mt-3 h-9 w-full rounded-xl bg-[#D74242] text-[13px] font-semibold text-white disabled:opacity-60"
                onClick={() => deleteMutation.mutate()}
                disabled={!deleteConfirmed || deleteMutation.isPending}
              >
                Удалить навсегда
              </button>
              <button
                type="button"
                className="mt-2 h-9 w-full rounded-xl border border-[#000043] text-[13px] font-semibold text-[#000043]"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmed(false);
                }}
              >
                Отмена
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
      {showEditForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-[#29292B] shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Редактирование профиля</h2>
                <p className="mt-1 text-sm text-[#29292B]/70">
                  Телефон меняется только через бота. Остальные данные можно обновить здесь.
                </p>
              </div>
              <button
                type="button"
                aria-label="Закрыть"
                onClick={() => setShowEditForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#000043]/10 text-[#000043] transition hover:bg-[#000043]/20"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-[#29292B]/70">Телефон</span>
                <input
                  type="text"
                  value={data?.phone || ''}
                  readOnly
                  className="h-11 rounded-xl border border-[#E2E2E2] bg-[#F7F7F7] px-3 text-[14px]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-[#29292B]/70">ФИО *</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 rounded-xl border border-[#E2E2E2] px-3 text-[14px]"
                  placeholder="Иванов Иван Иванович"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-[#29292B]/70">Дата рождения *</span>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="h-11 rounded-xl border border-[#E2E2E2] px-3 text-[14px]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-[#29292B]/70">Пол *</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female' | '')}
                  className="h-11 rounded-xl border border-[#E2E2E2] px-3 text-[14px]"
                >
                  <option value="">Выберите</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-[#29292B]/70">Email (необязательно)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border border-[#E2E2E2] px-3 text-[14px]"
                  placeholder="mail@example.com"
                />
              </label>
              {!data?.consent_given_at ? (
                <label className="flex items-start gap-2 text-[13px] text-[#29292B]/80">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1"
                  />
                  <span>{CONSENT_TEXT}</span>
                </label>
              ) : null}
              {editError ? (
                <div className="rounded-xl bg-red-100 px-3 py-2 text-[13px] text-red-700">{editError}</div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="w-full rounded-2xl bg-[#000043] px-4 py-3 text-sm font-semibold text-white"
                onClick={handleEditSubmit}
                disabled={profileMutation.isPending || consentMutation.isPending}
              >
                Сохранить
              </button>
              <button
                type="button"
                className="w-full rounded-2xl border border-[#000043] px-4 py-3 text-sm font-semibold text-[#000043]"
                onClick={openBot}
              >
                Обновить телефон через бота
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <AppBottomNav activeId="profile" />
    </div>
  );
};
