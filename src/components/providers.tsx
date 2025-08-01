'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { WalletProvider } from './wallet/wallet-provider';
import { DataPersistenceProvider } from '@/contexts/DataPersistenceContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <DataPersistenceProvider>
          {children}
        </DataPersistenceProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}