'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAccessToken, setOnTokenRefreshed, setOnLogout } from '../lib/api';

export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Sync React access token state with the Axios API module-level variable
  const updateAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    setAccessToken(token);
  };

  const handleLogout = () => {
    updateAccessToken(null);
    setUser(null);
    setIsLoading(false);
    // Removed automatic redirect to /login for public guest access
  };

  // Set up listeners for the Axios interceptor
  useEffect(() => {
    setOnTokenRefreshed((token: string) => {
      updateAccessToken(token);
    });

    setOnLogout(() => {
      handleLogout();
    });
  }, []);

  // Fetch current user on mount to recover session using HttpOnly refresh token
  useEffect(() => {
    const recoverSession = async () => {
      try {
        // Calling /me triggers a 401 if access token is empty,
        // which the Axios interceptor will catch and attempt to refresh using cookies.
        const response = await api.get<User>('/api/v1/users/me');
        setUser(response.data);
      } catch (err) {
        // If recovery fails, it means there is no valid refresh token either
        console.log('No active session could be recovered.');
      } finally {
        setIsLoading(false);
      }
    };

    recoverSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<{ access_token: string; user: User }>('/api/v1/users/login', {
        email,
        password,
      });

      updateAccessToken(response.data.access_token);
      setUser(response.data.user);
      setIsLoading(false);
      router.push(response.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setIsLoading(false);
      throw err.response?.data?.error || 'Login failed';
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // First, register the user
      await api.post<User>('/api/v1/users/register', {
        email,
        password,
      });

      // After successful registration, log them in automatically
      await login(email, password);
    } catch (err: any) {
      setIsLoading(false);
      throw err.response?.data?.error || 'Registration failed';
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/users/logout');
    } catch (err) {
      console.error('Logout API call failed:', err);
    }
    handleLogout();
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
