/** Allowed delivery status transitions — shared business rules */
export const STATUS_FLOW = {
  pending: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled'],
  in_transit: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function canTransition(from, to) {
  if (from === to) return true;
  const allowed = STATUS_FLOW[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function validateTransition(from, to) {
  if (canTransition(from, to)) return null;
  return `Invalid status transition from "${from}" to "${to}"`;
}
