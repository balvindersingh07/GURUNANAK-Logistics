import type {
  Customer,
  Delivery,
  Driver,
  Notification,
  Route,
  Vehicle,
  ProofOfDelivery,
  User,
} from '../types';
import { CITY_COORDS } from '../data/generators';

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function unwrapList<T>(res: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(res)) return res;
  return res.data ?? [];
}

function refId(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: string })._id);
  }
  return String(value);
}

export function mapDelivery(raw: Record<string, unknown>): Delivery {
  return {
    id: refId(raw._id ?? raw.id)!,
    trackingId: String(raw.trackingId ?? ''),
    customerId: refId(raw.customerId) ?? '',
    pickup: String(raw.pickup ?? ''),
    pickupCity: String(raw.pickupCity ?? ''),
    destination: String(raw.destination ?? ''),
    destinationCity: String(raw.destinationCity ?? ''),
    packageType: String(raw.packageType ?? ''),
    weight: String(raw.weight ?? ''),
    driverId: refId(raw.driverId),
    vehicleId: refId(raw.vehicleId),
    routeId: refId(raw.routeId),
    priority: (raw.priority as Delivery['priority']) ?? 'normal',
    status: (raw.status as Delivery['status']) ?? 'pending',
    createdDate: String(raw.createdDate ?? ''),
    expectedDelivery: String(raw.expectedDelivery ?? ''),
    eta: raw.eta ? String(raw.eta) : undefined,
    pickupLat: Number(raw.pickupLat ?? 0),
    pickupLng: Number(raw.pickupLng ?? 0),
    destLat: Number(raw.destLat ?? 0),
    destLng: Number(raw.destLng ?? 0),
    currentLat: raw.currentLat != null ? Number(raw.currentLat) : undefined,
    currentLng: raw.currentLng != null ? Number(raw.currentLng) : undefined,
    speed: raw.speed != null ? Number(raw.speed) : undefined,
    lastUpdated: raw.lastUpdated ? String(raw.lastUpdated) : undefined,
  };
}

export function mapDriver(raw: Record<string, unknown>): Driver {
  return {
    id: refId(raw._id ?? raw.id)!,
    name: String(raw.name ?? ''),
    phone: String(raw.phone ?? ''),
    email: String(raw.email ?? ''),
    licenseNumber: String(raw.licenseNumber ?? ''),
    licenseExpiry: String(raw.licenseExpiry ?? ''),
    address: String(raw.address ?? ''),
    vehicleId: refId(raw.vehicleId),
    currentDeliveryId: refId(raw.currentDeliveryId),
    status: (raw.status as Driver['status']) ?? 'available',
    rating: Number(raw.rating ?? 0),
    experience: Number(raw.experience ?? 0),
    totalDeliveries: Number(raw.totalDeliveries ?? 0),
    completedDeliveries: Number(raw.completedDeliveries ?? 0),
    cancelledDeliveries: Number(raw.cancelledDeliveries ?? 0),
  };
}

export function mapVehicle(raw: Record<string, unknown>): Vehicle {
  return {
    id: refId(raw._id ?? raw.id)!,
    vehicleNumber: String(raw.vehicleNumber ?? ''),
    registration: String(raw.registration ?? ''),
    type: (raw.type as Vehicle['type']) ?? 'Truck',
    capacity: String(raw.capacity ?? ''),
    driverId: refId(raw.driverId),
    status: (raw.status as Vehicle['status']) ?? 'available',
    mileage: Number(raw.mileage ?? 0),
    insuranceExpiry: String(raw.insuranceExpiry ?? ''),
    lastService: String(raw.lastService ?? ''),
    nextService: String(raw.nextService ?? ''),
  };
}

export function mapCustomer(raw: Record<string, unknown>): Customer {
  return {
    id: refId(raw._id ?? raw.id)!,
    name: String(raw.name ?? ''),
    phone: String(raw.phone ?? ''),
    email: String(raw.email ?? ''),
    address: String(raw.address ?? ''),
    totalDeliveries: Number(raw.totalDeliveries ?? 0),
    activeOrders: Number(raw.activeOrders ?? 0),
    lastDelivery: raw.lastDelivery ? String(raw.lastDelivery) : undefined,
  };
}

export function mapRoute(raw: Record<string, unknown>): Route {
  return {
    id: refId(raw._id ?? raw.id)!,
    routeId: String(raw.routeId ?? ''),
    origin: String(raw.origin ?? ''),
    destination: String(raw.destination ?? ''),
    stops: Array.isArray(raw.stops) ? (raw.stops as string[]) : [],
    distance: Number(raw.distance ?? 0),
    estimatedTime: String(raw.estimatedTime ?? ''),
    driverId: refId(raw.driverId),
    vehicleId: refId(raw.vehicleId),
    status: (raw.status as Route['status']) ?? 'scheduled',
  };
}

export function mapNotification(raw: Record<string, unknown>): Notification {
  return {
    id: refId(raw._id ?? raw.id)!,
    type: (raw.type as Notification['type']) ?? 'system_alert',
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    read: Boolean(raw.read),
    createdAt: raw.createdAt ? String(raw.createdAt) : new Date().toISOString(),
    link: raw.link ? String(raw.link) : undefined,
    deliveryId: refId(raw.deliveryId),
  };
}

export function mapProof(raw: Record<string, unknown>): ProofOfDelivery {
  return {
    id: refId(raw._id ?? raw.id)!,
    deliveryId: refId(raw.deliveryId)!,
    photoUrl: raw.photoUrl ? String(raw.photoUrl) : undefined,
    signature: raw.signature ? String(raw.signature) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    completedAt: String(raw.completedAt ?? new Date().toISOString()),
  };
}

export function mapUser(raw: Record<string, unknown>): User {
  return {
    id: refId(raw._id ?? raw.id)!,
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    role: raw.role as User['role'],
    password: '',
    customerId: refId(raw.customerId),
    driverId: refId(raw.driverId),
  } as User & { customerId?: string; driverId?: string };
}

function cityCoords(city: string | undefined): [number, number] | undefined {
  if (!city) return undefined;
  return CITY_COORDS[city];
}

/** Maps frontend Delivery fields to the backend create/update API contract. */
export function deliveryToApi(
  data: Partial<Delivery>,
  options?: { forCreate?: boolean },
): Record<string, unknown> {
  const { id: _id, ...rest } = data;
  const payload: Record<string, unknown> = { ...rest };

  const pickupCity = payload.pickupCity ? String(payload.pickupCity) : '';
  const destinationCity = payload.destinationCity ? String(payload.destinationCity) : '';

  if (pickupCity && payload.pickupLat == null && payload.pickupLng == null) {
    const coords = cityCoords(pickupCity);
    if (coords) {
      payload.pickupLat = coords[0];
      payload.pickupLng = coords[1];
    }
  }

  if (destinationCity && payload.destLat == null && payload.destLng == null) {
    const coords = cityCoords(destinationCity);
    if (coords) {
      payload.destLat = coords[0];
      payload.destLng = coords[1];
    }
  }

  if (options?.forCreate && !payload.createdDate) {
    payload.createdDate = new Date().toISOString().split('T')[0];
  }

  if (payload.currentLat == null && payload.pickupLat != null && payload.pickupLng != null) {
    payload.currentLat = payload.pickupLat;
    payload.currentLng = payload.pickupLng;
  }

  return payload;
}
