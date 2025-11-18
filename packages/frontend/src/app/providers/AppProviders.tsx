import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';

import { ToastProvider } from '@/shared/components/ToastProvider';
import { useToast } from '@/shared/hooks/useToast';
import { registerQueryErrorHandler, unregisterQueryErrorHandler } from '@/shared/lib/queryError';
import { queryClient } from '@/shared/lib/queryClient';

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

export const AppProviders = ({ children }: Props) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ToastProvider>
        <QueryErrorBridge>{children}</QueryErrorBridge>
      </ToastProvider>
    </BrowserRouter>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);
