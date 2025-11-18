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
    errorHandler(error.message);
    return;
  }

  if (error instanceof Error) {
    errorHandler(error.message);
    return;
  }

  errorHandler('Неизвестная ошибка. Повторите попытку позднее.');
};
