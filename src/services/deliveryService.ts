import apiRequest from './api';
import type { Delivery, DeliveryStatus } from '../types';
import type { PaginatedResponse } from '../utils/mappers';
import { mapDelivery, deliveryToApi } from '../utils/mappers';

export interface DeliveryQuery {
  page?: number;
  limit?: number;
  status?: DeliveryStatus;
  driverId?: string;
  customerId?: string;
  search?: string;
}

function buildQuery(params?: DeliveryQuery) {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const deliveryService = {
  getAll: (params?: DeliveryQuery) =>
    apiRequest<Delivery[] | PaginatedResponse<Record<string, unknown>>>(
      `/deliveries${buildQuery(params)}`,
    ),

  getById: async (id: string) => mapDelivery(await apiRequest<Record<string, unknown>>(`/deliveries/${id}`)),

  create: async (data: Partial<Delivery>) =>
    mapDelivery(
      await apiRequest<Record<string, unknown>>('/deliveries', {
        method: 'POST',
        body: JSON.stringify(deliveryToApi(data, { forCreate: true })),
      }),
    ),

  update: async (id: string, data: Partial<Delivery>) =>
    mapDelivery(
      await apiRequest<Record<string, unknown>>(`/deliveries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(deliveryToApi(data)),
      }),
    ),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/deliveries/${id}`, { method: 'DELETE' }),

  updateStatus: async (id: string, status: DeliveryStatus) =>
    mapDelivery(
      await apiRequest<Record<string, unknown>>(`/deliveries/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    ),

  submitProof: async (
    id: string,
    data: { photoUrl?: string; signature?: string; notes?: string },
  ) =>
    apiRequest<Record<string, unknown>>(`/deliveries/${id}/proof`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listProofs: () => apiRequest<Record<string, unknown>[]>('/deliveries/proofs'),
};
