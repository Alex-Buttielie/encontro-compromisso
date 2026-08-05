import type { ApiResponse, Workflow, HomeCareVisit } from '@/types';
import { api } from './client';

export const workflowApi = {
  async getAll() { return api.get<ApiResponse & { workflows: Workflow[] }>('/api/workflows'); },
  async create(data: { name: string; trigger: string; actions: { type: string; params?: Record<string, unknown> }[] }) { return api.post<ApiResponse & { workflow: Workflow }>('/api/workflows', data); },
  async trigger(id: number) { return api.post<ApiResponse>(`/api/workflows/${id}/trigger`); },
  async getExecutions() { return api.get<ApiResponse>('/api/workflows/executions'); },
};

export const homecareApi = {
  async getVisits() { return api.get<ApiResponse & { serviceArea: HomeCareVisit[] }>('/api/homecare/service-area'); },
  async createVisit(data: { clientName: string; address: string; scheduledAt: string }) { return api.post<ApiResponse & { serviceArea: HomeCareVisit }>('/api/homecare/service-area', data); },
  async getRoutes() { return api.get<ApiResponse>('/api/homecare/service-area'); },
};
