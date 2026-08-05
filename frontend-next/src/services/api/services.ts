import type { ApiResponse, Service } from '@/types';
import { api } from './client';

export const serviceApi = {
  async create(data: Partial<Service>) { return api.post<ApiResponse>('/api/services', data); },
  async getAll() { return api.get<ApiResponse & { services: Service[] }>('/api/services'); },
  async getById(id: number) { return api.get<ApiResponse & { service: Service }>(`/api/services/${id}`); },
  async update(id: number, data: Partial<Service>) { return api.put<ApiResponse>(`/api/services/${id}`, data); },
  async delete(id: number) { return api.delete<ApiResponse>(`/api/services/${id}`); },
};
