'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, apiRequest, refreshAccessToken, setAccessToken } from '@/lib/api/client';
import type { User } from '@/lib/api/types';

interface AuthState {
  user: User | null;
  /** false until the initial session restore (via the refresh cookie) finishes */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (await refreshAccessToken()) setUser(await api.get<User>('/users/me'));
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiRequest<{ access_token: string; user: User }>('/users/login', {
      method: 'POST',
      body: { email, password },
      retry: false,
    });
    setAccessToken(data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/users/logout', { method: 'POST', retry: false });
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
