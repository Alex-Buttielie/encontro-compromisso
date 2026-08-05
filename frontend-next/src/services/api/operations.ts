import type { ApiResponse, CRMClient, InventoryItem, Campaign, AnalyticsData } from '@/types';
import { api } from './client';

export const crmApi = {
  async getClients() { return api.get<ApiResponse & { crmClients: CRMClient[] }>('/api/crm/profiles'); },
  async getSegments() { return api.get<ApiResponse>('/api/crm/segments'); },
};

export const inventoryApi = {
  async getAll() { return api.get<ApiResponse & { products: InventoryItem[] }>('/api/inventory/products'); },
  async create(data: { name: string; sku?: string; category?: string; unit?: string; minStock?: number; unitPrice: number; supplierId?: number }) { return api.post<ApiResponse & { product: InventoryItem }>('/api/inventory/products', data); },
  async addStock(id: number, quantity: number) { return api.post<ApiResponse>(`/api/inventory/products/${id}/add-stock`, { quantity }); },
};

export const marketingApi = {
  async getCampaigns() { return api.get<ApiResponse & { campaigns: Campaign[] }>('/api/marketing/campaigns'); },
  async create(data: { name: string; channel: string; segment?: string }) { return api.post<ApiResponse & { campaign: Campaign }>('/api/marketing/campaigns', data); },
};

export const analyticsApi = {
  async getDashboard() { return api.get<ApiResponse & { analytics: AnalyticsData }>('/api/analytics/dashboard'); },
  async getGoals() { return api.get<ApiResponse>('/api/analytics/goals'); },
};
