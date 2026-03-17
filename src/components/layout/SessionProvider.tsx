'use client';

import React from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

interface SessionProviderProps {
  children: React.ReactNode;
}

export default function SessionProvider({
  children,
}: SessionProviderProps): React.ReactElement {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
