import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

import { withTelegramInitData } from '@/shared/api/telegram';
import { env } from '@/shared/config/env';

import type { ApiEnvelope, ApiSuccess } from './types';
import { ApiError } from './types';

const instance = axios.create({
  baseURL: `${env.apiBaseUrl}/api`,
  timeout: 10_000,
});

instance.interceptors.request.use((config) => {
  return withTelegramInitData(config);
});

instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status;
    if (error.code === AxiosError.ETIMEDOUT || error.code === 'ECONNABORTED') {
      throw new ApiError('Сервер не ответил вовремя. Попробуйте ещё раз.', 'timeout', status);
    }
    if (status === 401) {
      redirectToAppRoot();
      throw new ApiError(
        'Сессия Telegram истекла. Откройте мини-приложение заново.',
        'unauthorized',
        status,
      );
    }
    if (status && status >= 500) {
      throw new ApiError('Произошла ошибка сервера. Повторите попытку позже.', 'server_error', status);
    }

    const payload = error.response?.data;
    if (payload?.error) {
      throw new ApiError(payload.error.message, payload.error.type, status);
    }
    throw new ApiError(error.message || 'Unexpected error', 'network_error', status);
  },
);

export const parseApiEnvelope = <T>(payload: ApiEnvelope<T>): ApiSuccess<T> => {
  if (payload.error) {
    throw new ApiError(payload.error.message, payload.error.type);
  }

  if (payload.data === null) {
    throw new ApiError('Empty response payload', 'empty_response');
  }

  return {
    data: payload.data,
    pagination: payload.pagination ?? null,
  };
};

const request = async <T>(config: AxiosRequestConfig): Promise<ApiSuccess<T>> => {
  const response = await instance.request<ApiEnvelope<T>>(config);
  return parseApiEnvelope(response.data);
};

export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) => request<T>({ method: 'GET', url, ...config }),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ method: 'POST', url, data, ...config }),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ method: 'DELETE', url, ...config }),
};

const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';

const redirectToAppRoot = () => {
  if (typeof window === 'undefined') {
    return;
  }
  const target = env.appBaseUrl || window.location.origin;
  if (isTestEnv) {
    window.__braceRedirectTarget__ = target;
    return;
  }
  if (typeof window.location.replace === 'function') {
    try {
      window.location.replace(target);
      return;
    } catch {
      // jsdom and headless environments can throw for navigation helpers.
    }
  }
  window.location.href = target;
};
