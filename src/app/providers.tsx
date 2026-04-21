'use client';

import { SessionProvider } from 'next-auth/react';
import { SessionTimeout } from '@/components/session-timeout';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionTimeout />
      {children}
    </SessionProvider>
  );
}