import type { ApiResponse, Subscription, Referral, AIAgent, AgentExecution } from '@/types';
import { api } from './client';

export const subscriptionApi = {
  async getAll() { return api.get<ApiResponse & { subscriptions: Subscription[] }>('/api/subscriptions'); },
  async create(data: { planName: string; amount: number; interval: string }) { return api.post<ApiResponse & { subscription: Subscription }>('/api/subscriptions', data); },
  async suspend(id: number) { return api.post<ApiResponse>(`/api/subscriptions/${id}/suspend`); },
  async cancel(id: number) { return api.post<ApiResponse>(`/api/subscriptions/${id}/cancel`); },
  async reactivate(id: number) { return api.post<ApiResponse>(`/api/subscriptions/${id}/reactivate`); },
  async getBilling() { return api.get<ApiResponse>('/api/subscriptions/billing'); },
  async retryBilling(id: number) { return api.post<ApiResponse>(`/api/billings/${id}/retry`); },
};

export const referralApi = {
  async getAll() { return api.get<ApiResponse & { referrals: Referral[] }>('/api/referrals'); },
  async register(data: { referredName: string; referredEmail: string }) { return api.post<ApiResponse & { referral: Referral }>('/api/referrals/register', data); },
  async getRanking() { return api.get<ApiResponse>('/api/referrals/ranking'); },
  async getStats() { return api.get<ApiResponse>('/api/referrals/stats'); },
};

export const aiAgentApi = {
  async getAll() { return api.get<ApiResponse & { agents: AIAgent[] }>('/api/agents'); },
  async enable(id: number) { return api.post<ApiResponse>(`/api/agents/${id}/enable`); },
  async disable(id: number) { return api.post<ApiResponse>(`/api/agents/${id}/disable`); },
  async consent(id: number) { return api.post<ApiResponse>(`/api/agents/${id}/consent`); },
  async execute(id: number, prompt: string) { return api.post<ApiResponse & { execution: AgentExecution }>(`/api/agents/${id}/execute`, { prompt }); },
  async getExecutions() { return api.get<ApiResponse & { executions: AgentExecution[] }>('/api/agents/executions'); },
  async approveAction(executionId: number) { return api.post<ApiResponse>(`/api/agents/executions/${executionId}/approve`); },
  async rejectAction(executionId: number) { return api.post<ApiResponse>(`/api/agents/executions/${executionId}/reject`); },
  async getAudit() { return api.get<ApiResponse>('/api/agents/audit'); },
  async getUsage() { return api.get<ApiResponse>('/api/agents/usage'); },
};
