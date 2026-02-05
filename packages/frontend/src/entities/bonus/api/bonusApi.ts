import { apiClient } from '@/shared/api/httpClient';

import type { BonusBalance, BonusLedgerEntry } from '../model/types';

export type { BonusBalance, BonusLedgerEntry } from '../model/types';

export const bonusKeys = {
  balance: ['bonus', 'balance'] as const,
  ledger: ['bonus', 'ledger'] as const,
};

export const getBonusBalance = async (): Promise<BonusBalance> => {
  const response = await apiClient.get<BonusBalance>('/bonus/balance');
  return response.data;
};

export const getBonusLedger = async (): Promise<BonusLedgerEntry[]> => {
  const response = await apiClient.get<BonusLedgerEntry[]>('/bonus/ledger');
  return response.data;
};
