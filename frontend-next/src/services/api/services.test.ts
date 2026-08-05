import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockApi } = vi.hoisted(() => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { mockApi };
});

vi.mock('@/services/api/client', () => ({
  api: mockApi,
  ApiClient: vi.fn(() => mockApi),
}));

import { employeeApi, commissionApi, contractApi, quoteApi } from '@/services/api/team';
import { walletApi, loyaltyApi, packageApi } from '@/services/api/payments';
import { inventoryApi, crmApi } from '@/services/api/operations';
import { socialApi } from '@/services/api/engagement';
import { subscriptionApi } from '@/services/api/platform';
import { featureFlagApi, lgpdApi } from '@/services/api/admin';

describe('Team API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('employeeApi.getAll calls /api/employees', async () => {
    mockApi.get.mockResolvedValueOnce({ success: true, employees: [] });
    await employeeApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/api/employees');
  });

  it('employeeApi.create sends correct payload', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true, employee: {} });
    await employeeApi.create({ name: 'Test', email: 't@t.com', role: 'dentist' });
    expect(mockApi.post).toHaveBeenCalledWith('/api/employees', { name: 'Test', email: 't@t.com', role: 'dentist' });
  });

  it('commissionApi.getAll calls /api/commissions/rules', async () => {
    mockApi.get.mockResolvedValueOnce({ success: true, rules: [] });
    await commissionApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/api/commissions/rules');
  });

  it('commissionApi.create sends commissionType field', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true, rule: {} });
    await commissionApi.create({ employeeId: 1, commissionType: 'percentage', value: 10 });
    expect(mockApi.post).toHaveBeenCalledWith('/api/commissions/rules', { employeeId: 1, commissionType: 'percentage', value: 10 });
  });

  it('contractApi.create sends title and body', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true, contract: {} });
    await contractApi.create({ title: 'T', body: 'B' });
    expect(mockApi.post).toHaveBeenCalledWith('/api/contracts', { title: 'T', body: 'B' });
  });

  it('quoteApi.create sends items with price field', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true, quote: {} });
    await quoteApi.create({
      clientId: 1,
      items: [{ description: 'Item', price: 100, quantity: 1 }],
      validUntil: '2026-12-31',
    });
    expect(mockApi.post).toHaveBeenCalledWith('/api/quotes', {
      clientId: 1,
      items: [{ description: 'Item', price: 100, quantity: 1 }],
      validUntil: '2026-12-31',
    });
  });
});

describe('Payments API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('walletApi.getTransactions calls /api/wallet/statement', async () => {
    mockApi.get.mockResolvedValueOnce({ success: true, walletTransactions: [] });
    await walletApi.getTransactions();
    expect(mockApi.get).toHaveBeenCalledWith('/api/wallet/statement');
  });

  it('loyaltyApi.getAccount calls /api/loyalty/account', async () => {
    mockApi.get.mockResolvedValueOnce({ success: true, loyaltyAccount: {} });
    await loyaltyApi.getAccount();
    expect(mockApi.get).toHaveBeenCalledWith('/api/loyalty/account');
  });

  it('loyaltyApi.redeem calls /api/loyalty/points/spend', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true });
    await loyaltyApi.redeem(50);
    expect(mockApi.post).toHaveBeenCalledWith('/api/loyalty/points/spend', { points: 50 });
  });

  it('packageApi.redeem calls /api/packages/{id}/use', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true });
    await packageApi.redeem(1);
    expect(mockApi.post).toHaveBeenCalledWith('/api/packages/1/use');
  });
});

describe('Operations API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inventoryApi.getAll calls /api/inventory/products', async () => {
    mockApi.get.mockResolvedValueOnce({ success: true, products: [] });
    await inventoryApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/api/inventory/products');
  });

  it('crmApi.getClients calls /api/crm/profiles', async () => {
    mockApi.get.mockResolvedValueOnce({ success: true, crmClients: [] });
    await crmApi.getClients();
    expect(mockApi.get).toHaveBeenCalledWith('/api/crm/profiles');
  });
});

describe('Engagement API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('socialApi.getFeed calls /api/social/feed', async () => {
    mockApi.get.mockResolvedValueOnce({ success: true, posts: [] });
    await socialApi.getFeed();
    expect(mockApi.get).toHaveBeenCalledWith('/api/social/feed');
  });

  it('socialApi.createPost sends postType and caption', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true, post: {} });
    await socialApi.createPost({ postType: 'text', caption: 'Hello' });
    expect(mockApi.post).toHaveBeenCalledWith('/api/social/posts', { postType: 'text', caption: 'Hello' });
  });
});

describe('Platform API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscriptionApi.create sends planName, amount, interval', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true, subscription: {} });
    await subscriptionApi.create({ planName: 'Basic', amount: 29.90, interval: 'monthly' });
    expect(mockApi.post).toHaveBeenCalledWith('/api/subscriptions', { planName: 'Basic', amount: 29.90, interval: 'monthly' });
  });
});

describe('Admin API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('featureFlagApi.getAll calls /api/admin/feature-flags', async () => {
    mockApi.get.mockResolvedValueOnce({ success: true, flags: [] });
    await featureFlagApi.getAll();
    expect(mockApi.get).toHaveBeenCalledWith('/api/admin/feature-flags?role=admin');
  });

  it('lgpdApi.getRequests calls /api/lgpd/requests', async () => {
    mockApi.get.mockResolvedValueOnce({ success: true, dataRequests: [] });
    await lgpdApi.getRequests();
    expect(mockApi.get).toHaveBeenCalledWith('/api/lgpd/requests');
  });
});
