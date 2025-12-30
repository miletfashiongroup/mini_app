import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

import { ToastProvider } from '@/shared/components/ToastProvider';
import { useToast } from '@/shared/hooks/useToast';
import { queryClient } from '@/shared/lib/queryClient';
import { registerQueryErrorHandler, unregisterQueryErrorHandler } from '@/shared/lib/queryError';
import { initAnalytics } from '@/shared/analytics/tracker';
import { env } from '@/shared/config/env';

type Props = {
  children: React.ReactNode;
};

const QueryErrorBridge = ({ children }: { children: React.ReactNode }) => {
  const toast = useToast();
  useEffect(() => {
    registerQueryErrorHandler((message) => toast.error(message));
    return () => unregisterQueryErrorHandler();
  }, [toast]);
  return <>{children}</>;
};

const AnalyticsInit = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    initAnalytics({
      enabled: env.analyticsEnabled,
      flushIntervalMs: env.analyticsFlushIntervalMs,
      maxBatchSize: env.analyticsBatchSize,
    });
  }, []);
  return <>{children}</>;
};

const TelegramSwipeGuard = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    const body = document.body;
    const prevRootOverscroll = root.style.overscrollBehavior;
    const prevBodyOverscroll = body.style.overscrollBehavior;

    root.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';
    WebApp?.disableVerticalSwipes?.();

    return () => {
      root.style.overscrollBehavior = prevRootOverscroll;
      body.style.overscrollBehavior = prevBodyOverscroll;
      WebApp?.enableVerticalSwipes?.();
    };
  }, []);

  return <>{children}</>;
};

export const AppProviders = ({ children }: Props) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TelegramSwipeGuard>
        <ToastProvider>
          <AnalyticsInit>
            <QueryErrorBridge>{children}</QueryErrorBridge>
          </AnalyticsInit>
        </ToastProvider>
      </TelegramSwipeGuard>
    </BrowserRouter>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);
