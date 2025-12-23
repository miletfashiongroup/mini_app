import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';

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

export const AppProviders = ({ children }: Props) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ToastProvider>
        <AnalyticsInit>
          <QueryErrorBridge>{children}</QueryErrorBridge>
        </AnalyticsInit>
      </ToastProvider>
    </BrowserRouter>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);
