export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'customer';

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type DriverStatus = 'available' | 'on_delivery' | 'offline';

export type VehicleStatus = 'available' | 'on_trip' | 'maintenance' | 'inactive';

export type VehicleType = 'Truck' | 'Van' | 'Mini Truck' | 'Tempo';

export type RouteStatus = 'active' | 'scheduled' | 'completed' | 'inactive';

export type NotificationType =
  | 'delivery_update'
  | 'driver_assignment'
  | 'vehicle_maintenance'
  | 'customer_update'
  | 'system_alert';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
  avatar?: string;
  createdAt?: string;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  registration: string;
  type: VehicleType;
  capacity: string;
  driverId?: string;
  status: VehicleStatus;
  mileage: number;
  insuranceExpiry: string;
  lastService: string;
  nextService: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  address: string;
  vehicleId?: string;
  currentDeliveryId?: string;
  status: DriverStatus;
  rating: number;
  experience: number;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  avatar?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalDeliveries: number;
  activeOrders: number;
  lastDelivery?: string;
}

export interface Delivery {
  id: string;
  trackingId: string;
  customerId: string;
  pickup: string;
  pickupCity: string;
  destination: string;
  destinationCity: string;
  packageType: string;
  weight: string;
  driverId?: string;
  vehicleId?: string;
  priority: Priority;
  status: DeliveryStatus;
  createdDate: string;
  expectedDelivery: string;
  eta?: string;
  routeId?: string;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  currentLat?: number;
  currentLng?: number;
  speed?: number;
  lastUpdated?: string;
}

export interface Route {
  id: string;
  routeId: string;
  origin: string;
  destination: string;
  stops: string[];
  distance: number;
  estimatedTime: string;
  driverId?: string;
  vehicleId?: string;
  status: RouteStatus;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  deliveryId?: string;
}

export interface ProofOfDelivery {
  id: string;
  deliveryId: string;
  photoUrl?: string;
  signature?: string;
  notes?: string;
  completedAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface AppSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  address: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
}

export const DELIVERY_STATUSES: DeliveryStatus[] = [
  'pending',
  'assigned',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<DeliveryStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  assigned: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-cyan-100 text-cyan-800',
  out_for_delivery: 'bg-violet-100 text-violet-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const TIMELINE_STAGES: { key: DeliveryStatus; label: string }[] = [
  { key: 'pending', label: 'Order Created' },
  { key: 'assigned', label: 'Driver Assigned' },
  { key: 'picked_up', label: 'Pickup Completed' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

export function getStatusIndex(status: DeliveryStatus): number {
  const order: DeliveryStatus[] = [
    'pending',
    'assigned',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
  ];
  if (status === 'cancelled') return -1;
  return order.indexOf(status);
}

export function generateTrackingId(): string {
  return `GNK${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0')}`;
}

export function generateId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
