'use client';

import React from 'react';
// BLOCKED: Waiting on Backend Agent for next-auth setup
// When next-auth is configured, replace with:
// import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

interface SessionProviderProps {
  children: React.ReactNode;
}

export default function SessionProvider({
  children,
}: SessionProviderProps): React.ReactElement {
  // TEMPORARY: Pass-through wrapper until NextAuth is wired
  // Replace with: <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
  return <>{children}</>;
}
