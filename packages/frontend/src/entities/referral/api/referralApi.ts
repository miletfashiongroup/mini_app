import { apiClient } from '@/shared/api/httpClient';

import type { ReferralBinding, ReferralStats } from '../model/types';

export type { ReferralBinding, ReferralStats } from '../model/types';

export const referralKeys = {
  my: ['referrals', 'my'] as const,
};

export const applyReferralCode = async (code: string): Promise<ReferralBinding> => {
  const response = await apiClient.post<ReferralBinding>('/referrals/apply', { code });
  return response.data;
};

export const getReferralStats = async (): Promise<ReferralStats> => {
  const response = await apiClient.get<ReferralStats>('/referrals/my');
  return response.data;
};
