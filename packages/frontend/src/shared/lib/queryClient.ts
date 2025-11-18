import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { notifyQueryError } from '@/shared/lib/queryError';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: notifyQueryError,
  }),
  mutationCache: new MutationCache({
    onError: notifyQueryError,
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if ('status' in (error as Error) && (error as { status?: number }).status === 404) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});
