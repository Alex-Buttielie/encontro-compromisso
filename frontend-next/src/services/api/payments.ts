import type { ApiResponse, Payment, Wallet, WalletTransaction, LoyaltyAccount, ServicePackage, GiftCard } from '@/types';
import { api } from './client';

export const paymentApi = {
  async create(data: { amount: number; method: string; description?: string }) { return api.post<ApiResponse & { payment: Payment }>('/api/payments', data); },
  async getAll() { return api.get<ApiResponse & { payments: Payment[] }>('/api/payments'); },
  async refund(id: number) { return api.post<ApiResponse>(`/api/payments/${id}/refund`); },
};

export const walletApi = {
  async getBalance() { return api.get<ApiResponse & { wallet: Wallet }>('/api/wallet'); },
  async getTransactions() { return api.get<ApiResponse & { walletTransactions: WalletTransaction[] }>('/api/wallet/statement'); },
  async withdraw(amount: number) { return api.post<ApiResponse>('/api/wallet/withdraw', { amount }); },
  async transfer(toUserId: number, amount: number) { return api.post<ApiResponse>('/api/wallet/transfer', { toUserId, amount }); },
};

export const loyaltyApi = {
  async getAccount() { return api.get<ApiResponse & { loyaltyAccount: LoyaltyAccount }>('/api/loyalty/account'); },
  async redeem(points: number) { return api.post<ApiResponse>('/api/loyalty/points/spend', { points }); },
};

export const packageApi = {
  async getAll() { return api.get<ApiResponse & { packages: ServicePackage[] }>('/api/packages'); },
  async create(data: { name: string; totalSessions: number; price: number; validUntil: string; description?: string }) { return api.post<ApiResponse & { package: ServicePackage }>('/api/packages', data); },
  async redeem(id: number) { return api.post<ApiResponse>(`/api/packages/${id}/use`); },
};

export const giftCardApi = {
  async getAll() { return api.get<ApiResponse & { giftCards: GiftCard[] }>('/api/gift-cards'); },
  async create(data: { amount: number; recipientEmail: string; validUntil?: string }) { return api.post<ApiResponse & { giftCard: GiftCard }>('/api/gift-cards', data); },
  async redeem(code: string) { return api.post<ApiResponse>('/api/gift-cards/redeem', { code }); },
};
