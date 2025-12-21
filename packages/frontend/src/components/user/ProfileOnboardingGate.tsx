import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import WebApp from '@twa-dev/sdk';

import { useUserProfileQuery } from '@/shared/api/queries';
import { env } from '@/shared/config/env';
import { submitConsent, updateProfile } from '@/entities/user/api/userApi';

type Props = {
  children: React.ReactNode;
};

const isProfileComplete = (profile: any) => Boolean(profile?.profile_completed_at);
const SKIP_KEY = 'brace_profile_skip';
const CONSENT_TEXT = 'Я соглашаюсь на обработку персональных данных.';

export const ProfileOnboardingGate = ({ children }: Props) => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useUserProfileQuery();
  const needsProfile = !isProfileComplete(data);
  const [isSkipped, setIsSkipped] = useState(false);
  const showGate = !isLoading && !isError && needsProfile && !isSkipped;

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phone = data?.phone ?? '';

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

  const refreshProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsSkipped(localStorage.getItem(SKIP_KEY) === '1');
  }, []);

  useEffect(() => {
    if (!data) return;
    setFullName(data.full_name || [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || '');
    setBirthDate(data.birth_date ? String(data.birth_date) : '');
    setGender((data.gender as 'male' | 'female' | undefined) || '');
    setEmail(data.email || '');
    setConsent(Boolean(data.consent_given_at));
  }, [data]);

  const consentMutation = useMutation({
    mutationFn: () => submitConsent({ consent: true, consent_text: CONSENT_TEXT }),
  });

  const profileMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        full_name: fullName,
        phone,
        email: email.trim() ? email.trim() : null,
        birth_date: birthDate,
        gender: gender || 'male',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setError(null);
    },
  });

  const handleSubmit = async () => {
    setError(null);
    if (!consent) {
      setError('Нужно согласиться на обработку данных.');
      return;
    }
    if (!phone) {
      setError('Сначала поделитесь номером телефона в боте.');
      return;
    }
    if (!fullName.trim() || !birthDate || !gender) {
      setError('Заполните все обязательные поля.');
      return;
    }
    try {
      if (!data?.consent_given_at) {
        await consentMutation.mutateAsync();
      }
      await profileMutation.mutateAsync();
    } catch (err: any) {
      setError(err?.message || 'Не удалось сохранить профиль.');
    }
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SKIP_KEY, '1');
    }
    setIsSkipped(true);
  };

  return (
    <>
      {children}
      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-[#29292B] shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Заполните данные</h2>
                <p className="mt-1 text-sm text-[#29292B]/70">
                  Поделитесь контактом в боте, затем заполните анкету здесь.
                </p>
              </div>
              <button
                type="button"
                aria-label="Закрыть"
                onClick={handleSkip}
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
                  value={phone || ''}
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
              <label className="flex items-start gap-2 text-[13px] text-[#29292B]/80">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1"
                />
                <span>{CONSENT_TEXT}</span>
              </label>
              {error ? <div className="rounded-xl bg-red-100 px-3 py-2 text-[13px] text-red-700">{error}</div> : null}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="w-full rounded-2xl bg-[#000043] px-4 py-3 text-sm font-semibold text-white"
                onClick={handleSubmit}
                disabled={profileMutation.isPending || consentMutation.isPending}
              >
                Сохранить данные
              </button>
              <button
                type="button"
                className="w-full rounded-2xl border border-[#000043] px-4 py-3 text-sm font-semibold text-[#000043]"
                onClick={openBot}
              >
                Открыть бота для контакта
              </button>
              <button
                type="button"
                className="w-full text-xs font-semibold text-[#000043]/70 underline"
                onClick={handleSkip}
              >
                Пропустить регистрацию
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
