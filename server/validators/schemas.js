import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  role: z.enum(['customer', 'driver']).default('customer'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export const deliverySchema = z.object({
  trackingId: z.string().min(1).optional(),
  customerId: z.string().min(1),
  pickup: z.string().min(1),
  pickupCity: z.string().min(1),
  destination: z.string().min(1),
  destinationCity: z.string().min(1),
  packageType: z.string().min(1),
  weight: z.string().min(1),
  driverId: z.string().optional(),
  vehicleId: z.string().optional(),
  routeId: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  status: z
    .enum([
      'pending',
      'assigned',
      'picked_up',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ])
    .optional(),
  createdDate: z.string().min(1),
  expectedDelivery: z.string().min(1),
  eta: z.string().optional(),
  pickupLat: z.number(),
  pickupLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  currentLat: z.number().optional(),
  currentLng: z.number().optional(),
  speed: z.number().optional(),
});

export const deliveryStatusSchema = z.object({
  status: z.enum([
    'pending',
    'assigned',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ]),
});

export const driverSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  licenseNumber: z.string().min(1),
  licenseExpiry: z.string().min(1),
  address: z.string().min(1),
  vehicleId: z.string().optional(),
  status: z.enum(['available', 'on_delivery', 'offline']).optional(),
  rating: z.number().min(0).max(5).optional(),
  experience: z.number().min(0).optional(),
});

export const vehicleSchema = z.object({
  vehicleNumber: z.string().min(1),
  registration: z.string().min(1),
  type: z.enum(['Truck', 'Van', 'Mini Truck', 'Tempo']),
  capacity: z.string().min(1),
  driverId: z.string().optional(),
  status: z.enum(['available', 'on_trip', 'maintenance', 'inactive']).optional(),
  mileage: z.number().min(0).optional(),
  insuranceExpiry: z.string().min(1),
  lastService: z.string().min(1),
  nextService: z.string().min(1),
});

export const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  address: z.string().min(1),
  totalDeliveries: z.number().min(0).optional(),
  activeOrders: z.number().min(0).optional(),
  lastDelivery: z.string().optional(),
});

export const routeSchema = z.object({
  routeId: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  stops: z.array(z.string()).optional(),
  distance: z.number().min(0),
  estimatedTime: z.string().min(1),
  driverId: z.string().optional(),
  vehicleId: z.string().optional(),
  status: z.enum(['active', 'scheduled', 'completed', 'inactive']).optional(),
});
