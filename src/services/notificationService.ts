import apiRequest from './api';
import type { Notification } from '../types';
import type { PaginatedResponse } from '../utils/mappers';
import { mapNotification } from '../utils/mappers';

export const notificationService = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const q = params
      ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`
      : '';
    const res = await apiRequest<
      Notification[] | PaginatedResponse<Record<string, unknown>>
    >(`/notifications${q}`);
    const list = Array.isArray(res) ? res : res.data;
    return list.map((n) => mapNotification(n as Record<string, unknown>));
  },

  markRead: (id: string) =>
    apiRequest<Record<string, unknown>>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () =>
    apiRequest<{ message: string }>('/notifications/read-all', { method: 'PATCH' }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' }),
};
