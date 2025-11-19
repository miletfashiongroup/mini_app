declare global {
  interface Window {
    __BRACE_ENV__?: {
      API_BASE_URL?: string;
      APP_URL?: string;
    };
  }
}

const runtimeEnv = typeof window !== 'undefined' ? window.__BRACE_ENV__ : undefined;
const isProdBuild = import.meta.env.PROD;

const isLocalLike = (value?: string) =>
  Boolean(value) && /(localhost|127\.0\.0\.1)/i.test(value ?? '');

const preferRuntimeValue = (value?: string) => {
  if (!value) {
    return undefined;
  }

  if (isProdBuild && isLocalLike(value)) {
    return undefined;
  }

  return value;
};

const getValidatedApiBaseUrl = () => {
  const runtimeValue = preferRuntimeValue(runtimeEnv?.API_BASE_URL);
  if (runtimeValue) {
    return runtimeValue;
  }

  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  return isProdBuild ? 'https://brace-1-backend.onrender.com' : 'http://localhost:8000';
};

const getValidatedAppBaseUrl = () => {
  const runtimeValue = preferRuntimeValue(runtimeEnv?.APP_URL);
  if (runtimeValue) {
    return runtimeValue;
  }

  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }

  return isProdBuild ? 'https://brace-1-frontend.onrender.com' : 'http://localhost';
};

export const env = {
  apiBaseUrl: getValidatedApiBaseUrl(),
  appBaseUrl: getValidatedAppBaseUrl(),
  devInitData: import.meta.env.VITE_DEV_INIT_DATA ?? '',
};
