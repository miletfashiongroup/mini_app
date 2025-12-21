import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import WebApp from '@twa-dev/sdk';

import { useUserProfileQuery } from '@/shared/api/queries';
import { env } from '@/shared/config/env';

type Props = {
  children: React.ReactNode;
};

const isProfileComplete = (profile: any) => Boolean(profile?.profile_completed_at);

export const ProfileOnboardingGate = ({ children }: Props) => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useUserProfileQuery();
  const needsProfile = !isProfileComplete(data);
  const showGate = !isLoading && !isError && needsProfile;

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

  return (
    <>
      {children}
      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-[#29292B] shadow-2xl">
            <h2 className="text-xl font-bold">Нужно заполнить данные в боте</h2>
            <p className="mt-3 text-sm">
              Для доступа к приложению пройдите регистрацию в чате с ботом: согласие →
              контакт → ФИО → дата рождения → пол → email.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="w-full rounded-2xl bg-[#000043] px-4 py-3 text-sm font-semibold text-white"
                onClick={openBot}
              >
                Открыть бота
              </button>
              <button
                type="button"
                className="w-full rounded-2xl border border-[#000043] px-4 py-3 text-sm font-semibold text-[#000043]"
                onClick={refreshProfile}
              >
                Я уже заполнила — проверить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
