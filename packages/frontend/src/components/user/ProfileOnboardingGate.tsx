import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { submitConsent, updateProfile, userKeys } from '@/entities/user/api/userApi';
import { useUserProfileQuery } from '@/shared/api/queries';
import { requestTelegramContact } from '@/shared/api/telegram';
import { useToast } from '@/shared/hooks/useToast';
import { queryClient } from '@/shared/lib/queryClient';

type Props = {
  children: React.ReactNode;
};

const CONSENT_TEXT = 'Вы согласны на обработку ваших данных?';

const isProfileComplete = (profile: any) =>
  Boolean(
    profile?.consent_given_at &&
      profile?.full_name &&
      profile?.phone &&
      profile?.birth_date &&
      profile?.gender,
  );

export const ProfileOnboardingGate = ({ children }: Props) => {
  const toast = useToast();
  const { data, isLoading, isError } = useUserProfileQuery();
  const [step, setStep] = useState<'consent' | 'profile'>('consent');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

  const needsConsent = !data?.consent_given_at;
  const needsProfile = !isProfileComplete(data);

  useEffect(() => {
    if (data) {
      if (!needsConsent) {
        setStep('profile');
      } else {
        setStep('consent');
      }
      setFullName(data.full_name ?? '');
      setPhone(data.phone ?? '');
      setEmail(data.email ?? '');
      setBirthDate(data.birth_date ?? '');
      setGender((data.gender as 'male' | 'female') ?? '');
    }
  }, [data, needsConsent]);

  const consentMutation = useMutation({
    mutationFn: submitConsent,
    onSuccess: (profile) => {
      queryClient.setQueryData(userKeys.profile, profile);
      setStep('profile');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Не удалось сохранить согласие.');
    },
  });

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(userKeys.profile, profile);
      toast.success('Данные сохранены.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Не удалось сохранить данные.');
    },
  });

  const canSubmitProfile = useMemo(
    () =>
      fullName.trim().length >= 2 &&
      phone.trim().length >= 8 &&
      birthDate &&
      gender,
    [fullName, phone, birthDate, gender],
  );

  const requestContact = async () => {
    const result = await requestTelegramContact();
    if (!result) {
      toast.error('Не удалось получить номер телефона.');
      return;
    }
    setPhone(result);
  };

  const handleConsent = () => {
    if (consentMutation.isPending) return;
    consentMutation.mutate({ consent: true, consent_text: CONSENT_TEXT });
  };

  const handleProfileSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmitProfile || profileMutation.isPending) return;
    profileMutation.mutate({
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      birth_date: birthDate,
      gender: gender as 'male' | 'female',
    });
  };

  const showGate = !isLoading && !isError && (needsConsent || needsProfile);

  return (
    <>
      {children}
      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-[#29292B] shadow-2xl">
            {step === 'consent' ? (
              <>
                <h2 className="text-xl font-bold">Согласие на обработку данных</h2>
                <p className="mt-3 text-sm">{CONSENT_TEXT}</p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    className="flex-1 rounded-2xl bg-[#000043] px-4 py-3 text-sm font-semibold text-white"
                    onClick={handleConsent}
                    disabled={consentMutation.isPending}
                  >
                    Да
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-2xl border border-[#000043] px-4 py-3 text-sm font-semibold text-[#000043]"
                    onClick={() => toast.info('Без согласия доступ ограничен.')}
                  >
                    Нет
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold">Заполните данные</h2>
                <form className="mt-4 space-y-3" onSubmit={handleProfileSubmit}>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#4A4A4A]">ФИО</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Иванов Иван Иванович"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#4A4A4A]">Телефон</label>
                    <div className="flex gap-2">
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        placeholder="+7 900 000-00-00"
                        required
                      />
                      <button
                        type="button"
                        className="rounded-xl border border-[#000043] px-3 text-xs font-semibold text-[#000043]"
                        onClick={requestContact}
                      >
                        Поделиться
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#4A4A4A]">Email (необязательно)</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="email@example.com"
                      type="email"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#4A4A4A]">Дата рождения</label>
                    <input
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      type="date"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#4A4A4A]">Пол</label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={gender === 'male'}
                          onChange={() => setGender('male')}
                        />
                        Мужской
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={gender === 'female'}
                          onChange={() => setGender('female')}
                        />
                        Женский
                      </label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#000043] px-4 py-3 text-sm font-semibold text-white"
                    disabled={!canSubmitProfile || profileMutation.isPending}
                  >
                    Сохранить
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
