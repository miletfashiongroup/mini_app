import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

import { resolveTelegramInitDataAsync, withTelegramInitData } from '@/shared/api/telegram';
import { env } from '@/shared/config/env';

import type { ApiEnvelope, ApiSuccess } from './types';
import { ApiError } from './types';

const instance = axios.create({
  baseURL: `${env.apiBaseUrl}/api`,
  timeout: 15_000,
});

instance.interceptors.request.use((config) => withTelegramInitData(config));

instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status;
    const originalConfig = error.config as AxiosRequestConfig & { __braceRetried?: boolean };

    // Retry once with freshly resolved init data if we got auth-related errors.
    if (status === 401 || status === 403) {
      const payload = error.response?.data;
      const authRelated = payload?.error?.type === 'access_denied' || payload?.error?.type === 'unauthorized';
      if (!originalConfig?.__braceRetried) {
        const refreshedInitData = await resolveTelegramInitDataAsync(4000);
        if (refreshedInitData) {
          originalConfig.__braceRetried = true;
          originalConfig.headers = {
            ...(originalConfig.headers ?? {}),
            'X-Telegram-Init-Data': refreshedInitData,
            Authorization: `tma ${refreshedInitData}`,
          };
          return instance.request(originalConfig);
        }
      }
      if (status === 401) {
        redirectToAppRoot();
        throw new ApiError(
          'Сессия Telegram истекла. Откройте мини-приложение заново.',
          'unauthorized',
          status,
        );
      }
      if (status === 403 && authRelated) {
        throw new ApiError(
          'Проблема с авторизацией в Telegram. Закройте и снова откройте мини-приложение из Telegram.',
          'access_denied',
          status,
        );
      }
    }

    if (error.code === AxiosError.ETIMEDOUT || error.code === 'ECONNABORTED') {
      throw new ApiError('Сервер не ответил вовремя. Попробуйте ещё раз.', 'timeout', status);
    }
    if (status && status >= 500) {
      throw new ApiError('Произошла ошибка сервера. Повторите попытку позже.', 'server_error', status);
    }

    const payload = error.response?.data;
    if (payload?.error) {
      throw new ApiError(payload.error.message, payload.error.type, status);
    }
    throw new ApiError(error.message || 'network_error', 'network_error', status);
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
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ method: 'PUT', url, data, ...config }),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ method: 'PATCH', url, data, ...config }),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ method: 'DELETE', url, ...config }),
};

const isTestEnv =
  (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') ||
  (typeof process !== 'undefined' && process.env.VITEST);

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
