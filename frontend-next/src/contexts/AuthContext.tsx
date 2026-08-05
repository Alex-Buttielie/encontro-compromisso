'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types';
import { authApi } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; errors?: string[] }>;
  register: (data: { name: string; email: string; password: string; role: string; profession?: string; termsAccepted?: boolean; privacyAccepted?: boolean }) => Promise<{ success: boolean; user?: User; errors?: string[] }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; errors?: string[] }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('profissionalOS_token');
      if (!token) { setLoading(false); return; }
      const res = await authApi.getCurrentUser();
      if (res.success && res.user) setUser(res.user);
      else authApi.logout();
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (res.success && res.user) {
      authApi.saveSession(res.user, res.token);
      setUser(res.user);
      return { success: true, user: res.user };
    }
    return { success: false, errors: res.errors };
  };

  const register = async (data: { name: string; email: string; password: string; role: string; profession?: string; termsAccepted?: boolean; privacyAccepted?: boolean }) => {
    const res = await authApi.register(data);
    if (res.success && res.user) {
      authApi.saveSession(res.user, res.token);
      setUser(res.user);
      return { success: true, user: res.user };
    }
    return { success: false, errors: res.errors };
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const res = await authApi.updateProfile(updates);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, errors: res.errors };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
