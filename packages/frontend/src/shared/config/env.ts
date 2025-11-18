const runtimeBaseUrl =
  typeof window !== 'undefined' ? window.__BRACE_ENV__?.API_BASE_URL : undefined;
const runtimeAppUrl = typeof window !== 'undefined' ? window.__BRACE_ENV__?.APP_URL : undefined;

export const env = {
  // PRINCIPAL-FIX: runtime api config
  apiBaseUrl: runtimeBaseUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
  appBaseUrl: runtimeAppUrl || import.meta.env.VITE_APP_URL || 'http://localhost',
  devInitData: import.meta.env.VITE_DEV_INIT_DATA ?? '',
};
