import type { ApiResponse, Work, WorkOrder, CustomField } from '@/types';
import { api } from './client';

export const workApi = {
  async create(data: { title: string; description?: string; price: number; category?: string; customFields: CustomField[] }) { return api.post<ApiResponse & { work: Work }>('/api/works', data); },
  async getAll() { return api.get<ApiResponse & { works: Work[] }>('/api/works'); },
  async getById(id: number) { return api.get<ApiResponse & { work: Work }>(`/api/works/${id}`); },
  async update(id: number, data: Partial<Work>) { return api.put<ApiResponse>(`/api/works/${id}`, data); },
  async delete(id: number) { return api.delete<ApiResponse>(`/api/works/${id}`); },
  async explore(search = '') { const url = search ? `/api/works/explore?search=${encodeURIComponent(search)}` : '/api/works/explore'; return api.get<ApiResponse & { works: Work[] }>(url); },
};

export const workOrderApi = {
  async create(workId: number, fieldData: Record<string, string>, notes = '') { return api.post<ApiResponse & { order: WorkOrder }>('/api/work-orders', { workId, fieldData, notes }); },
  async getReceived() { return api.get<ApiResponse & { orders: WorkOrder[] }>('/api/work-orders/received'); },
  async getPlaced() { return api.get<ApiResponse & { orders: WorkOrder[] }>('/api/work-orders/placed'); },
  async accept(id: number) { return api.post<ApiResponse>(`/api/work-orders/${id}/accept`); },
  async reject(id: number) { return api.post<ApiResponse>(`/api/work-orders/${id}/reject`); },
  async complete(id: number) { return api.post<ApiResponse>(`/api/work-orders/${id}/complete`); },
  async cancel(id: number) { return api.post<ApiResponse>(`/api/work-orders/${id}/cancel`); },
};
