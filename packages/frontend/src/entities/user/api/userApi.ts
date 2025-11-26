import { apiClient } from '@/shared/api/httpClient';

import type { UserProfile } from '../model/types';

export type { UserProfile } from '../model/types';

export const userKeys = {
  profile: ['me'] as const,
};

export const fetchProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>('/users/me');
  return response.data;
};
