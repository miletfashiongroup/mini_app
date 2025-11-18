import { apiClient } from '@/shared/api/httpClient';

export type SizeCalcPayload = {
  waist: number;
  hip: number;
};

export type SizeCalcResult = {
  size: string;
};

export const calculateSize = async (payload: SizeCalcPayload): Promise<SizeCalcResult> => {
  const response = await apiClient.post<SizeCalcResult>('/size/calc', payload);
  return response.data;
};
