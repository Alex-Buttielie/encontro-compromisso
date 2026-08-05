import type { ApiResponse, Transaction, FinancialSummary } from '@/types';
import { api } from './client';

export const transactionApi = {
  async create(data: Partial<Transaction>) { return api.post<ApiResponse>('/api/transactions', data); },
  async getAll() { return api.get<ApiResponse & { transactions: Transaction[] }>('/api/transactions'); },
  async delete(id: number) { return api.delete<ApiResponse>(`/api/transactions/${id}`); },
  async pay(id: number) { return api.post<ApiResponse>(`/api/transactions/${id}/pay`); },
  async getSummary() { return api.get<ApiResponse & { summary: FinancialSummary }>('/api/finance/summary'); },
  async getMonthlyIncome(year: number, month: number) { return api.get<ApiResponse & { income: number }>(`/api/finance/monthly-income?year=${year}&month=${month}`); },
};
