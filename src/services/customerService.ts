import apiRequest from './api';
import type { Customer } from '../types';
import type { PaginatedResponse } from '../utils/mappers';
import { mapCustomer } from '../utils/mappers';

export interface CustomerQuery {
  page?: number;
  limit?: number;
  search?: string;
}

function buildQuery(params?: CustomerQuery) {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const customerService = {
  getAll: (params?: CustomerQuery) =>
    apiRequest<Customer[] | PaginatedResponse<Record<string, unknown>>>(
      `/customers${buildQuery(params)}`,
    ),

  getById: async (id: string) =>
    mapCustomer(await apiRequest<Record<string, unknown>>(`/customers/${id}`)),

  create: async (data: Partial<Customer>) =>
    mapCustomer(
      await apiRequest<Record<string, unknown>>('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ),

  update: async (id: string, data: Partial<Customer>) =>
    mapCustomer(
      await apiRequest<Record<string, unknown>>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    ),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/customers/${id}`, { method: 'DELETE' }),
};
