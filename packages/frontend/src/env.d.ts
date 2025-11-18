/// <reference types="vite/client" />

declare global {
  interface BraceRuntimeEnv {
    API_BASE_URL?: string;
  }

  interface Window {
    __BRACE_ENV__?: BraceRuntimeEnv;
  }
}

export {};
