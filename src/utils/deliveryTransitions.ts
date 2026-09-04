import type { DeliveryStatus } from '../types';

export const STATUS_FLOW: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled'],
  in_transit: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: DeliveryStatus, to: DeliveryStatus): boolean {
  if (from === to) return true;
  return STATUS_FLOW[from]?.includes(to) ?? false;
}

export function getNextStatuses(from: DeliveryStatus): DeliveryStatus[] {
  return STATUS_FLOW[from] ?? [];
}

export function validateTransition(from: DeliveryStatus, to: DeliveryStatus): string | null {
  if (canTransition(from, to)) return null;
  return `Invalid status transition from "${from}" to "${to}"`;
}

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
