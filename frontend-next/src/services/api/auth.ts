import type { ApiResponse, User } from '@/types';
import { api } from './client';

export const authApi = {
  async login(email: string, password: string) { return api.post<ApiResponse & { user: User; token?: string }>('/api/auth/login', { email, password }); },
  async register(data: { name: string; email: string; password: string; role: string; profession?: string; termsAccepted?: boolean; privacyAccepted?: boolean }) { return api.post<ApiResponse & { user: User; token?: string }>('/api/auth/register', data); },
  async getCurrentUser() { return api.get<ApiResponse & { user: User }>('/api/auth/profile'); },
  async updateProfile(updates: Partial<User>) { return api.put<ApiResponse & { user: User }>('/api/auth/profile', updates); },
  saveSession(user: User, token?: string) { if (token) api.setToken(token); else if (user?.id) api.setToken(user.id.toString()); },
  logout() { api.setToken(null); },
  getCurrentUserId() { return api.token ? parseInt(api.token) : null; },
};
