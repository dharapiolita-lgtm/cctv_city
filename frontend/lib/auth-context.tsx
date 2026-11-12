'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile, UserRole } from '@/types';
import { api, ApiError } from '@/lib/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  checkAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('cctvcity_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const cachedUser = localStorage.getItem('cctvcity_user');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }

      // Re-validate token with backend
      const freshUser = await api.get<UserProfile>('/auth/me');
      setUser(freshUser);
      localStorage.setItem('cctvcity_user', JSON.stringify(freshUser));
    } catch (err) {
      console.warn('Sesi login tidak valid:', err);
      localStorage.removeItem('cctvcity_token');
      localStorage.removeItem('cctvcity_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (token: string, userProfile: UserProfile) => {
    localStorage.setItem('cctvcity_token', token);
    localStorage.setItem('cctvcity_user', JSON.stringify(userProfile));
    setUser(userProfile);

    // Redirect sesuai role
    switch (userProfile.role) {
      case 'petugas':
        router.push('/officer/dashboard');
        break;
      case 'pimpinan':
        router.push('/executive/dashboard');
        break;
      case 'admin':
      case 'operator':
      default:
        router.push('/dashboard');
        break;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('cctvcity_token');
      localStorage.removeItem('cctvcity_user');
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

