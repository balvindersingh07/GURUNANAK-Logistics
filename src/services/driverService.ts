import apiRequest from './api';
import type { Driver } from '../types';
import type { PaginatedResponse } from '../utils/mappers';
import { mapDriver } from '../utils/mappers';

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

function buildQuery(params?: ListQuery) {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const driverService = {
  getAll: (params?: ListQuery) =>
    apiRequest<Driver[] | PaginatedResponse<Record<string, unknown>>>(
      `/drivers${buildQuery(params)}`,
    ),

  getById: async (id: string) => mapDriver(await apiRequest<Record<string, unknown>>(`/drivers/${id}`)),

  create: async (data: Partial<Driver>) =>
    mapDriver(
      await apiRequest<Record<string, unknown>>('/drivers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ),

  update: async (id: string, data: Partial<Driver>) =>
    mapDriver(
      await apiRequest<Record<string, unknown>>(`/drivers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    ),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/drivers/${id}`, { method: 'DELETE' }),
};
