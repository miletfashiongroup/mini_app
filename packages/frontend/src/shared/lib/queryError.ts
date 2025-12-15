import { ApiError } from '@/shared/api/types';

let errorHandler: ((message: string) => void) | null = null;

export const registerQueryErrorHandler = (handler: (message: string) => void) => {
  errorHandler = handler;
};

export const unregisterQueryErrorHandler = () => {
  errorHandler = null;
};

export const notifyQueryError = (error: unknown) => {
  if (!errorHandler) {
    return;
  }

  if (error instanceof ApiError) {
    // Do not spam UI with auth-related popups; these are handled by redirects/retries.
    if (error.type === 'unauthorized' || error.type === 'access_denied') {
      return;
    }
    errorHandler(error.message);
    return;
  }

  if (error instanceof Error) {
    errorHandler(error.message);
    return;
  }

  errorHandler('Неизвестная ошибка. Повторите попытку позднее.');
};
