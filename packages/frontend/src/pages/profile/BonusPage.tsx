import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppBottomNav, PageTopBar } from '@/components/brace';
import { useBonusBalance, useBonusLedgerQuery } from '@/shared/api/queries';
import { formatDateShort, daysUntil } from '@/shared/lib/date';
import { formatPoints } from '@/shared/lib/points';
import { PageBlock } from '@/shared/ui';
import type { BonusLedgerEntry } from '@/entities/bonus/api/bonusApi';

const resolveReasonLabel = (entry: BonusLedgerEntry) => {
  if (entry.type === 'debit') return 'Списание при покупке';
  if (entry.type === 'expire') return 'Сгорание бонусов';
  if (entry.type === 'credit') {
    const reason = (entry.reason || '').toLowerCase();
    if (reason.includes('referral') || reason.includes('invite')) {
      return 'Начисление за приглашённого пользователя';
    }
    return 'Начисление за заказ';
  }
  return 'Начисление за заказ';
};

const resolveAmountLabel = (entry: BonusLedgerEntry) => {
  const sign = entry.type === 'debit' || entry.type === 'expire' ? '-' : '+';
  return `${sign}${formatPoints(entry.amount)}`;
};

const findNearestExpire = (entries: BonusLedgerEntry[]) => {
  const candidates = entries
    .filter((entry) => entry.expires_at)
    .map((entry) => ({
      entry,
      time: entry.expires_at ? new Date(entry.expires_at).getTime() : Number.NaN,
    }))
    .filter((item) => !Number.isNaN(item.time))
    .sort((a, b) => a.time - b.time);
  return candidates[0]?.entry ?? null;
};

export const BonusPage = () => {
  const navigate = useNavigate();
  const { data: balanceData, isLoading: balanceLoading } = useBonusBalance();
  const { data: ledgerData, isLoading: ledgerLoading, isError: ledgerError } = useBonusLedgerQuery();

  const balance = balanceData?.balance ?? 0;
  const ledger = useMemo(() => ledgerData ?? [], [ledgerData]);
  const nearestExpire = useMemo(() => findNearestExpire(ledger), [ledger]);
  const expireDays = nearestExpire?.expires_at ? daysUntil(nearestExpire.expires_at) : null;

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1000px] flex-col bg-white pb-28 font-montserrat text-text-primary">
      <PageTopBar showBack backFallback="/profile" />
      <div className="px-4 pb-4 pt-4">
        <h1 className="text-[27px] font-bold leading-[1.1] text-[#29292B]">Бонусы</h1>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6">
        <PageBlock title="Баланс">
          {balanceLoading ? (
            <div className="text-[14px]">Загружаем баланс...</div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-[28px] font-bold text-[#29292B]">
                {formatPoints(balance)} баллов
              </div>
              <div className="text-[13px] text-[#5A5A5C]">Можно использовать при покупке</div>
              {balance <= 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-[#CFCFD6] bg-white px-4 py-3 text-[13px] text-[#5A5A5C]">
                  У вас пока нет бонусов
                  <button
                    type="button"
                    onClick={() => navigate('/profile/referrals')}
                    className="mt-2 block text-[13px] font-semibold text-[#000043] underline"
                  >
                    Как получить бонусы
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </PageBlock>

        {expireDays !== null ? (
          <PageBlock title="Ближайшее сгорание">
            <div className="text-[14px] text-[#29292B]">Сгорит через {expireDays} дней</div>
          </PageBlock>
        ) : null}

        <PageBlock title="История операций">
          {ledgerLoading ? (
            <div className="text-[14px]">Загружаем операции...</div>
          ) : ledgerError ? (
            <div className="text-[14px]">Не удалось загрузить историю.</div>
          ) : ledger.length ? (
            <div className="flex flex-col gap-3">
              {ledger.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-[#E6E6E9] bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-semibold text-[#29292B]">
                        {resolveReasonLabel(entry)}
                      </div>
                      <div className="mt-1 text-[12px] text-[#5A5A5C]">
                        {formatDateShort(entry.created_at)}
                      </div>
                    </div>
                    <div className="text-[14px] font-semibold text-[#29292B]">
                      {resolveAmountLabel(entry)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[14px] text-[#5A5A5C]">История пока пуста.</div>
          )}
        </PageBlock>
      </div>
      <AppBottomNav activeId="profile" />
    </div>
  );
};
