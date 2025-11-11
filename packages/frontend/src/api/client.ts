import axios from 'axios';
import WebApp from '@twa-dev/sdk';

const client = axios.create({
  baseURL: `${__BACKEND_URL__}/api`,
});

client.interceptors.request.use((config) => {
  const initData = WebApp.initData || '';
  config.headers['X-Telegram-Init-Data'] = initData;
  return config;
});

export default client;
