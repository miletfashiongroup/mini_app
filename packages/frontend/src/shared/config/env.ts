const runtimeBaseUrl =
  typeof window !== 'undefined' ? window.__BRACE_ENV__?.API_BASE_URL : undefined;

export const env = {
  // PRINCIPAL-FIX: runtime api config
  apiBaseUrl: runtimeBaseUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
  devInitData: import.meta.env.VITE_DEV_INIT_DATA ?? '',
};
