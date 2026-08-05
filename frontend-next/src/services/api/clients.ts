import type { ApiResponse, Client } from '@/types';
import { api } from './client';

export const clientApi = {
  async create(data: Partial<Client>) { return api.post<ApiResponse>('/api/clients', data); },
  async getAll(page = 1, limit = 20) { return api.get<ApiResponse & { clients: Client[]; total?: number; page?: number; pages?: number }>(`/api/clients?page=${page}&limit=${limit}`); },
  async getById(id: number) { return api.get<ApiResponse & { client: Client }>(`/api/clients/${id}`); },
  async update(id: number, data: Partial<Client>) { return api.put<ApiResponse>(`/api/clients/${id}`, data); },
  async delete(id: number) { return api.delete<ApiResponse>(`/api/clients/${id}`); },
  async search(term: string) { return api.get<ApiResponse & { clients: Client[] }>(`/api/clients?search=${encodeURIComponent(term)}`); },
};
