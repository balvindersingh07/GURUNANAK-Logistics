import type {
  Customer,
  Delivery,
  Driver,
  Notification,
  Route,
  User,
  Vehicle,
  AppSettings,
} from '../types';
import { generateId } from '../types';
import {
  generateCustomers,
  generateDrivers,
  generateVehicles,
  generateDeliveries,
  generateRoutes,
  CITY_COORDS,
} from './generators';

const _vehicles = generateVehicles(15);
const _customers = generateCustomers(20);
_customers[0] = {
  ..._customers[0],
  name: 'Anita Mehta',
  email: 'customer@gurunanak.com',
  phone: '+91 98765 43213',
  address: 'C-Scheme, Jaipur, Rajasthan 302001',
};

const _drivers = generateDrivers(10);
_drivers[0] = {
  ..._drivers[0],
  name: 'Vikram Singh',
  email: 'driver@gurunanak.com',
  phone: '+91 98765 43212',
  vehicleId: 'v1',
  currentDeliveryId: 'del1',
  status: 'on_delivery',
};

export const INITIAL_CUSTOMERS: Customer[] = _customers;
export const INITIAL_DRIVERS: Driver[] = _drivers;
export const INITIAL_VEHICLES: Vehicle[] = _vehicles;
export const INITIAL_DELIVERIES: Delivery[] = generateDeliveries(20, _customers, _drivers, _vehicles);
export const INITIAL_ROUTES: Route[] = generateRoutes(10, _drivers, _vehicles);

export const DEMO_USERS: User[] = [
  {
    id: 'u1',
    name: 'Rajesh Kumar',
    email: 'admin@gurunanak.com',
    phone: '+91 98765 43210',
    role: 'admin',
    password: 'admin123',
  },
  {
    id: 'u2',
    name: 'Priya Sharma',
    email: 'dispatcher@gurunanak.com',
    phone: '+91 98765 43211',
    role: 'dispatcher',
    password: 'dispatch123',
  },
  {
    id: 'u3',
    name: 'Vikram Singh',
    email: 'driver@gurunanak.com',
    phone: '+91 98765 43212',
    role: 'driver',
    password: 'driver123',
  },
  {
    id: 'u4',
    name: 'Anita Mehta',
    email: 'customer@gurunanak.com',
    phone: '+91 98765 43213',
    role: 'customer',
    password: 'customer123',
  },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'delivery_update',
    title: 'Delivery In Transit',
    message: 'GNK202603011001 is now in transit. ETA updated.',
    read: false,
    createdAt: '2026-03-03T08:30:00',
    link: '/deliveries/del1',
  },
  {
    id: 'n2',
    type: 'driver_assignment',
    title: 'Driver Assigned',
    message: 'Vikram Singh has been assigned to an active delivery',
    read: false,
    createdAt: '2026-03-03T07:15:00',
  },
  {
    id: 'n3',
    type: 'vehicle_maintenance',
    title: 'Maintenance Due',
    message: 'Vehicle GNK-TMP-004 is scheduled for maintenance',
    read: true,
    createdAt: '2026-03-02T16:00:00',
    link: '/fleet',
  },
  {
    id: 'n4',
    type: 'customer_update',
    title: 'New Customer Registration',
    message: 'A new customer has been added to the database',
    read: true,
    createdAt: '2026-03-02T11:30:00',
    link: '/customers',
  },
  {
    id: 'n5',
    type: 'system_alert',
    title: 'System Update',
    message: 'GURUNANAK platform updated to v2.5.0 with enhanced tracking',
    read: false,
    createdAt: '2026-03-01T09:00:00',
  },
  {
    id: 'n6',
    type: 'delivery_update',
    title: 'Delivery Completed',
    message: 'A delivery was successfully completed in Jodhpur',
    read: true,
    createdAt: '2026-03-01T18:45:00',
    link: '/deliveries/del6',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'GURUNANAK Transportation & Logistics',
  companyEmail: 'info@gurunanak.com',
  companyPhone: '+91 141 4001234',
  address: 'Plot 45, VKI Area, Jaipur, Rajasthan 302013',
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  twoFactorEnabled: false,
};

export const FAQ_DATA = [
  {
    category: 'Deliveries',
    questions: [
      {
        q: 'How do I create a new delivery?',
        a: 'Navigate to Deliveries and click "+ Create Delivery". Fill in customer, pickup, destination, and package details.',
      },
      {
        q: 'What delivery statuses are available?',
        a: 'Pending, Assigned, Picked Up, In Transit, Out for Delivery, Delivered, and Cancelled.',
      },
    ],
  },
  {
    category: 'Tracking',
    questions: [
      {
        q: 'How can customers track deliveries?',
        a: 'Customers can enter their Tracking ID on the dashboard or use the Live Tracking page for real-time updates.',
      },
      {
        q: 'How often is location updated?',
        a: 'Vehicle locations are updated every 30 seconds during active deliveries.',
      },
    ],
  },
  {
    category: 'Drivers',
    questions: [
      {
        q: 'How do drivers update delivery status?',
        a: 'Drivers use the mobile-friendly dashboard to progress through Assigned → Picked Up → In Transit → Delivered.',
      },
    ],
  },
  {
    category: 'Fleet',
    questions: [
      {
        q: 'How do I schedule vehicle maintenance?',
        a: 'Go to Fleet Management, select a vehicle, and click "Maintenance" to update status and service dates.',
      },
    ],
  },
  {
    category: 'Account',
    questions: [
      {
        q: 'How do I change my password?',
        a: 'Go to Settings > Security or Profile page and use the Change Password section.',
      },
    ],
  },
];

export { CITY_COORDS, generateId };
