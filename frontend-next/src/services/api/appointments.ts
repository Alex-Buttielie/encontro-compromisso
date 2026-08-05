import type { ApiResponse, Appointment } from '@/types';
import { api } from './client';

export const appointmentApi = {
  async create(data: Partial<Appointment>) { return api.post<ApiResponse>('/api/appointments', data); },
  async getByDate(date: string) { return api.get<ApiResponse & { appointments: Appointment[] }>(`/api/appointments?date=${encodeURIComponent(date)}`); },
  async getToday() { return api.get<ApiResponse & { appointments: Appointment[] }>('/api/appointments/today'); },
  async getUpcoming() { return api.get<ApiResponse & { appointments: Appointment[] }>('/api/appointments/upcoming'); },
  async getById(id: number) { return api.get<ApiResponse & { appointment: Appointment }>(`/api/appointments/${id}`); },
  async update(id: number, data: Partial<Appointment>) { return api.put<ApiResponse>(`/api/appointments/${id}`, data); },
  async delete(id: number) { return api.delete<ApiResponse>(`/api/appointments/${id}`); },
  async confirm(id: number) { return api.post<ApiResponse>(`/api/appointments/${id}/confirm`); },
  async complete(id: number) { return api.post<ApiResponse>(`/api/appointments/${id}/complete`); },
  async cancel(id: number) { return api.post<ApiResponse>(`/api/appointments/${id}/cancel`); },
};
