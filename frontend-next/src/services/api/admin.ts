import type { ApiResponse, AuditLog, FeatureFlag, ApiKey, Webhook, DataRequest, AdminUser } from '@/types';
import { api } from './client';

export const adminApi = {
  async getDashboard() { return api.get<ApiResponse & { dashboard: Record<string, unknown> }>('/api/admin/dashboard'); },
  async getUsers() { return api.get<ApiResponse & { users: AdminUser[] }>('/api/admin/users'); },
  async createUser(data: { email: string; role: string }) { return api.post<ApiResponse & { user: AdminUser }>('/api/admin/users', data); },
  async toggleAdmin(userId: number) { return api.post<ApiResponse>(`/api/admin/users/${userId}/toggle-admin`, { role: 'admin' }); },
  async blockUser(userId: number, role: string, reason?: string) { return api.post<ApiResponse>(`/api/admin/users/${userId}/block`, { role, reason }); },
  async unblockUser(userId: number, role: string) { return api.post<ApiResponse>(`/api/admin/users/${userId}/unblock`, { role }); },
  async approveProvider(userId: number, role: string) { return api.post<ApiResponse>(`/api/admin/users/${userId}/approve`, { role }); },
  async rejectProvider(userId: number, role: string, reason?: string) { return api.post<ApiResponse>(`/api/admin/users/${userId}/reject`, { role, reason }); },
  async moderatePost(postId: number, role: string, action: string, reason?: string) { return api.post<ApiResponse>(`/api/admin/moderate/post/${postId}`, { role, action, reason }); },
  async getAudit(role: string) { return api.get<ApiResponse & { auditLogs: AuditLog[] }>(`/api/admin/audit?role=${role}`); },
};

export const featureFlagApi = {
  async getAll() { return api.get<ApiResponse & { flags: FeatureFlag[] }>('/api/admin/feature-flags?role=admin'); },
  async create(data: { key: string; enabled: boolean; description?: string }) { return api.post<ApiResponse & { flag: FeatureFlag }>('/api/admin/feature-flags', { ...data, role: 'admin' }); },
  async toggle(id: number) { return api.post<ApiResponse & { flag: FeatureFlag }>(`/api/admin/feature-flags/${id}/toggle`, { role: 'admin' }); },
};

export const apiKeyApi = {
  async getAll() { return api.get<ApiResponse & { apiKeys: ApiKey[] }>('/api/api-keys'); },
  async create(data: { name: string; scopes: string[] }) { return api.post<ApiResponse & { apiKey: ApiKey }>('/api/api-keys', data); },
  async revoke(id: number) { return api.post<ApiResponse & { apiKey: ApiKey }>(`/api/api-keys/${id}/revoke`); },
};

export const webhookApi = {
  async getAll() { return api.get<ApiResponse & { webhooks: Webhook[] }>('/api/webhooks'); },
  async create(data: { url: string; events: string[] }) { return api.post<ApiResponse & { webhook: Webhook }>('/api/webhooks', data); },
  async disable(id: number) { return api.post<ApiResponse & { webhook: Webhook }>(`/api/webhooks/${id}/disable`); },
};

export const lgpdApi = {
  async getRequests() { return api.get<ApiResponse & { dataRequests: DataRequest[] }>('/api/lgpd/requests'); },
  async createRequest(requestType: string) { return api.post<ApiResponse & { dataRequest: DataRequest }>('/api/lgpd/requests', { requestType }); },
  async processRequest(id: number) { return api.post<ApiResponse & { dataRequest: DataRequest; exportData?: Record<string, unknown> }>(`/api/lgpd/requests/${id}/process`); },
  async rejectRequest(id: number, reason: string) { return api.post<ApiResponse & { dataRequest: DataRequest }>(`/api/lgpd/requests/${id}/reject`, { reason }); },
};
