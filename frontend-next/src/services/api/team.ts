import type { ApiResponse, Employee, Commission, Branch, Contract, Quote } from '@/types';
import { api } from './client';

export const employeeApi = {
  async getAll() { return api.get<ApiResponse & { employees: Employee[] }>('/api/employees'); },
  async create(data: { name: string; email: string; role: string; branchId?: number }) { return api.post<ApiResponse & { employee: Employee }>('/api/employees', data); },
  async invite(email: string, role: string) { return api.post<ApiResponse>('/api/employees/invite', { email, role }); },
};

export const commissionApi = {
  async getAll() { return api.get<ApiResponse & { rules: Commission[] }>('/api/commissions/rules'); },
  async create(data: { employeeId: number; serviceId?: number; commissionType: string; value: number }) { return api.post<ApiResponse & { rule: Commission }>('/api/commissions/rules', data); },
};

export const branchApi = {
  async getAll() { return api.get<ApiResponse & { branches: Branch[] }>('/api/branches'); },
  async create(data: { name: string; address?: string; phone?: string }) { return api.post<ApiResponse & { branch: Branch }>('/api/branches', data); },
};

export const contractApi = {
  async getAll() { return api.get<ApiResponse & { contracts: Contract[] }>('/api/contracts'); },
  async create(data: { title: string; body: string }) { return api.post<ApiResponse & { contract: Contract }>('/api/contracts', data); },
  async sign(id: number) { return api.post<ApiResponse>(`/api/contracts/${id}/sign`); },
};

export const quoteApi = {
  async getAll() { return api.get<ApiResponse & { quotes: Quote[] }>('/api/quotes'); },
  async create(data: { clientId?: number; items: { description: string; quantity: number; price: number }[]; validUntil: string }) { return api.post<ApiResponse & { quote: Quote }>('/api/quotes', data); },
  async approve(id: number) { return api.post<ApiResponse>(`/api/quotes/${id}/approve`); },
  async reject(id: number) { return api.post<ApiResponse>(`/api/quotes/${id}/reject`); },
};
