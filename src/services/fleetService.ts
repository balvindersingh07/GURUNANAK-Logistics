import apiRequest from './api';
import type { Vehicle } from '../types';
import type { PaginatedResponse } from '../utils/mappers';
import { mapVehicle } from '../utils/mappers';

export interface FleetQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

function buildQuery(params?: FleetQuery) {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const fleetService = {
  getAll: (params?: FleetQuery) =>
    apiRequest<Vehicle[] | PaginatedResponse<Record<string, unknown>>>(
      `/vehicles${buildQuery(params)}`,
    ),

  getById: async (id: string) =>
    mapVehicle(await apiRequest<Record<string, unknown>>(`/vehicles/${id}`)),

  create: async (data: Partial<Vehicle>) =>
    mapVehicle(
      await apiRequest<Record<string, unknown>>('/vehicles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ),

  update: async (id: string, data: Partial<Vehicle>) =>
    mapVehicle(
      await apiRequest<Record<string, unknown>>(`/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    ),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/vehicles/${id}`, { method: 'DELETE' }),
};
