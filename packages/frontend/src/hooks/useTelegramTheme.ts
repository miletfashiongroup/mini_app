import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

const useTelegramTheme = () => {
  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    WebApp.disableVerticalSwipes();

    const body = document.body;
    const setTheme = () => {
      body.style.backgroundColor = WebApp.backgroundColor ?? '#000';
    };

    setTheme();
    WebApp.onEvent('themeChanged', setTheme);

    return () => {
      WebApp.offEvent('themeChanged', setTheme);
    };
  }, []);
};

export default useTelegramTheme;
