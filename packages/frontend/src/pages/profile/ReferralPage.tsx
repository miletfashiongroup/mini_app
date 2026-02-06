import { useMemo, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppBottomNav, PageTopBar } from '@/components/brace';
import { applyReferralCode, referralKeys } from '@/entities/referral/api/referralApi';
import type { ReferralInvite, ReferralStats } from '@/entities/referral/model/types';
import { useReferral } from '@/shared/api/queries';
import { env } from '@/shared/config/env';
import { formatDateShort } from '@/shared/lib/date';
import { PageBlock } from '@/shared/ui';

const STATUS_LABELS: Record<ReferralInvite['status'], string> = {
  pending: 'Ожидает',
  approved: 'Начислено',
  rejected: 'Отклонено',
};

const buildShareText = (stats?: ReferralStats | null) => {
  const code = stats?.code ?? '';
  if (!code) return 'Присоединяйся к нашему магазину!';
  return `Мой реферальный код: ${code}. Первый заказ — и я получу 10% бонусами.`;
};

const buildShareUrl = (stats?: ReferralStats | null) => {
  const code = stats?.code ?? '';
  if (!code) return '';
  return `https://t.me/${env.telegramBotUsername}?start=ref_${encodeURIComponent(code)}`;
};

export const ReferralPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useReferral();
  const stats = data ?? null;
  const invites = useMemo(() => stats?.invited ?? [], [stats]);
  const [codeInput, setCodeInput] = useState('');
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const applyMutation = useMutation({
    mutationFn: (code: string) => applyReferralCode(code),
    onSuccess: () => {
      setApplyError(null);
      setApplyMessage('Код применён. Бонус начислится после первой покупки.');
      queryClient.invalidateQueries({ queryKey: referralKeys.my });
      setCodeInput('');
    },
    onError: (err: any) => {
      setApplyMessage(null);
      setApplyError(err?.message || 'Не удалось применить код.');
    },
  });

  const handleCopy = async () => {
    if (!stats?.code) return;
    const text = stats.code;
    try {
      await navigator.clipboard.writeText(text);
      setApplyMessage('Код скопирован.');
      setApplyError(null);
    } catch {
      setApplyMessage('Не удалось скопировать код.');
    }
  };

  const handleShare = async () => {
    const text = buildShareText(stats);
    const url = buildShareUrl(stats);
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        // ignore share cancellations
      }
    }
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (typeof WebApp?.openTelegramLink === 'function') {
      WebApp.openTelegramLink(shareUrl);
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(shareUrl, '_blank');
    }
  };

  const handleApply = () => {
    setApplyError(null);
    setApplyMessage(null);
    if (!codeInput.trim()) {
      setApplyError('Введите код.');
      return;
    }
    applyMutation.mutate(codeInput.trim());
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar showBack backFallback="/profile" />
      <div className="px-4 pb-4 pt-4">
        <h1 className="text-[27px] font-bold leading-[1.1] text-[#29292B]">Рефералы</h1>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6">
        <PageBlock title="Мой код">
          {isLoading ? (
            <div className="text-[14px]">Загружаем код...</div>
          ) : isError ? (
            <div className="text-[14px]">Не удалось загрузить данные.</div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-[#E6E6E9] bg-white px-4 py-3 text-[18px] font-bold text-[#29292B]">
                {stats?.code || '—'}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-2xl border border-[#000043] px-4 py-2 text-[13px] font-semibold text-[#000043]"
                >
                  Скопировать
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="rounded-2xl bg-[#000043] px-4 py-2 text-[13px] font-semibold text-white"
                >
                  Поделиться
                </button>
              </div>
            </div>
          )}
        </PageBlock>

        <PageBlock title="Как это работает">
          <div className="flex flex-col gap-2 text-[14px] text-[#29292B]">
            <div>1. Друг делает первый заказ</div>
            <div>2. Вы получаете 10% бонусами</div>
            <div>3. Минимум 1000 ₽, только денежная часть</div>
          </div>
        </PageBlock>

        <PageBlock title="Приглашённые">
          {isLoading ? (
            <div className="text-[14px]">Загружаем список...</div>
          ) : isError ? (
            <div className="text-[14px]">Не удалось загрузить список.</div>
          ) : invites.length ? (
            <div className="flex flex-col gap-3">
              {invites.map((invite) => (
                <div key={invite.referee_user_id} className="rounded-2xl border border-[#E6E6E9] bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-semibold text-[#29292B]">
                        {STATUS_LABELS[invite.status]}
                      </div>
                      <div className="mt-1 text-[12px] text-[#5A5A5C]">
                        {formatDateShort(invite.created_at)}
                      </div>
                    </div>
                    <span className="rounded-full bg-[#F2F2F6] px-3 py-1 text-[12px] font-semibold text-[#29292B]">
                      {STATUS_LABELS[invite.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#CFCFD6] bg-white px-4 py-3 text-[13px] text-[#5A5A5C]">
              Вы ещё никого не пригласили
              <button
                type="button"
                onClick={handleShare}
                className="mt-2 block text-[13px] font-semibold text-[#000043] underline"
              >
                Поделиться кодом
              </button>
            </div>
          )}
        </PageBlock>

        <PageBlock title="Применить код">
          <div className="grid gap-3 text-[14px]">
            <input
              type="text"
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value)}
              className="h-11 rounded-xl border border-[#E2E2E2] px-3 text-[14px]"
              placeholder="Введите код"
            />
            <button
              type="button"
              onClick={handleApply}
              disabled={applyMutation.isPending}
              className="h-11 rounded-2xl bg-[#000043] text-[14px] font-semibold text-white disabled:opacity-60"
            >
              {applyMutation.isPending ? 'Применяем...' : 'Применить'}
            </button>
            {applyMessage ? (
              <div className="text-[12px] font-semibold text-green-600">{applyMessage}</div>
            ) : null}
            {applyError ? (
              <div className="text-[12px] font-semibold text-red-500">{applyError}</div>
            ) : null}
          </div>
        </PageBlock>
      </div>
      <AppBottomNav activeId="profile" />
    </div>
  );
};
