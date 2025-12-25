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

export type UserConsentRequest = {
  consent: boolean;
  consent_text: string;
};

export type UserProfileUpdate = {
  full_name: string;
  phone: string;
  email?: string | null;
  birth_date: string;
  gender: 'male' | 'female';
};

export const submitConsent = async (payload: UserConsentRequest): Promise<UserProfile> => {
  const response = await apiClient.post<UserProfile>('/users/me/consent', payload);
  return response.data;
};

export const updateProfile = async (payload: UserProfileUpdate): Promise<UserProfile> => {
  const response = await apiClient.put<UserProfile>('/users/me/profile', payload);
  return response.data;
};

export const deleteProfile = async (): Promise<void> => {
  await apiClient.delete('/users/me');
};
