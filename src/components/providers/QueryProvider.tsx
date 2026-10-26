'use client';

// src/components/providers/QueryProvider.tsx
// Global TanStack React Query Provider for client-side caching, background deduplication, and stale-while-revalidate

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 60 seconds fresh in memory before background revalidation
            gcTime: 5 * 60 * 1000, // Keep in memory for 5 minutes
            refetchOnWindowFocus: false, // Prevent distracting refetches on tab switch
            retry: 1, // Single retry on transient network failures
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
