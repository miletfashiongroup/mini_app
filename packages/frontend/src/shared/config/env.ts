export const env = {
  apiBaseUrl: 'https://brace-1-backend.onrender.com',
  appBaseUrl: 'https://brace-1-frontend.onrender.com',
  devInitData: import.meta.env.VITE_DEV_INIT_DATA ?? '',
} as const;

console.log('🎯 PRODUCTION CONFIG LOADED:');
console.log('API:', env.apiBaseUrl);
console.log('APP:', env.appBaseUrl);