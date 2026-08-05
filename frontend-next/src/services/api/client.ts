import type { ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export class ApiClient {
  private baseUrl: string;
  token: string | null;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = typeof localStorage !== 'undefined' ? localStorage.getItem('profissionalOS_token') || null : null;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('profissionalOS_token', token);
    else localStorage.removeItem('profissionalOS_token');
  }

  private async request<T = ApiResponse>(method: string, endpoint: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
    if (this.token) options.headers = { ...options.headers, Authorization: `Bearer ${this.token}` };
    if (body) options.body = JSON.stringify(body);
    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data?.errors) return data as T;
        return { success: false, errors: [`Erro HTTP ${response.status}`] } as T;
      }
      return data as T;
    } catch {
      return { success: false, errors: ['Erro de conexão com o servidor'] } as T;
    }
  }

  get<T = ApiResponse>(endpoint: string) { return this.request<T>('GET', endpoint); }
  post<T = ApiResponse>(endpoint: string, body?: unknown) { return this.request<T>('POST', endpoint, body); }
  put<T = ApiResponse>(endpoint: string, body?: unknown) { return this.request<T>('PUT', endpoint, body); }
  delete<T = ApiResponse>(endpoint: string) { return this.request<T>('DELETE', endpoint); }
}

export const api = new ApiClient();
