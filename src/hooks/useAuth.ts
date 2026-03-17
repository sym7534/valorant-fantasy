'use client';

import { useState, useEffect } from 'react';
// TEMPORARY — replace with real NextAuth session when available
// BLOCKED: Waiting on Backend Agent for auth.ts

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // TEMPORARY: Mock auth state — replace with `getSession()` from next-auth
    const timer = setTimeout(() => {
      setState({
        user: {
          id: 'user1',
          name: 'AcePlayer',
          email: 'ace@example.com',
          image: undefined,
        },
        isLoading: false,
        isAuthenticated: true,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return state;
}
