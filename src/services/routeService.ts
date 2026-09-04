import apiRequest from './api';
import type { Route } from '../types';
import type { PaginatedResponse } from '../utils/mappers';
import { mapRoute } from '../utils/mappers';

export interface RouteQuery {
  page?: number;
  limit?: number;
  status?: string;
}

function buildQuery(params?: RouteQuery) {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const routeService = {
  getAll: (params?: RouteQuery) =>
    apiRequest<Route[] | PaginatedResponse<Record<string, unknown>>>(
      `/routes${buildQuery(params)}`,
    ),

  getById: async (id: string) =>
    mapRoute(await apiRequest<Record<string, unknown>>(`/routes/${id}`)),

  create: async (data: Partial<Route>) =>
    mapRoute(
      await apiRequest<Record<string, unknown>>('/routes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ),

  update: async (id: string, data: Partial<Route>) =>
    mapRoute(
      await apiRequest<Record<string, unknown>>(`/routes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    ),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/routes/${id}`, { method: 'DELETE' }),
};
