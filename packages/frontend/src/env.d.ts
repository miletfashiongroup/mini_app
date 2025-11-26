/// <reference types="vite/client" />

declare global {
  interface BraceRuntimeEnv {
    API_BASE_URL?: string;
    APP_URL?: string;
  }

  interface Window {
    __BRACE_ENV__?: BraceRuntimeEnv;
    __braceRedirectTarget__?: string;
  }
}

export {};
