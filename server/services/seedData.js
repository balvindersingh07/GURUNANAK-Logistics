import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Delivery from '../models/Delivery.js';
import Route from '../models/Route.js';
import Notification from '../models/Notification.js';
import { isDbConnected } from '../config/db.js';

const CITIES = [
  'Jaipur',
  'Sri Ganganagar',
  'Hanumangarh',
  'Bikaner',
  'Jodhpur',
  'Delhi',
  'Ludhiana',
  'Chandigarh',
  'Amritsar',
];

export const CITY_COORDS = {
  Jaipur: [26.9124, 75.7873],
  'Sri Ganganagar': [29.9038, 73.8772],
  Hanumangarh: [29.5815, 74.3294],
  Bikaner: [28.0229, 73.3119],
  Jodhpur: [26.2389, 73.0243],
  Delhi: [28.6139, 77.209],
  Ludhiana: [30.901, 75.8573],
  Chandigarh: [30.7333, 76.7794],
  Amritsar: [31.634, 74.8723],
};

const CUSTOMER_NAMES = [
  'Anita Mehta',
  'Sharma Electronics Pvt Ltd',
  'Rajasthan Agro Supplies',
  'Punjab Textile Mills',
  'Delhi Fresh Foods',
  'Ganganagar Traders',
  'Jodhpur Handicrafts',
  'Bikaner Salt Works',
  'Ludhiana Auto Parts',
  'Chandigarh Pharma',
  'Amritsar Spices Co',
  'Hanumangarh Grains',
  'Jaipur Gems Export',
  'Delhi Tech Solutions',
  'Rajasthan Dairy',
  'Punjab Cotton Mills',
  'Sri Ganganagar Fertilizers',
  'Jodhpur Furniture Hub',
  'Bikaner Solar Energy',
  'Delhi E-Commerce Hub',
];

const DRIVER_NAMES = [
  'Vikram Singh',
  'Suresh Patel',
  'Ramesh Yadav',
  'Harpreet Kaur',
  'Mohit Agarwal',
  'Deepak Sharma',
  'Gurpreet Singh',
  'Amit Verma',
  'Sanjay Meena',
  'Kuldeep Rajput',
];

const PACKAGE_TYPES = [
  'Electronics',
  'Agriculture',
  'Textiles',
  'Food & Beverages',
  'Industrial Parts',
  'Pharmaceuticals',
  'Furniture',
];

const DELIVERY_STATUSES = [
  'pending',
  'assigned',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const VEHICLE_TYPES = ['Truck', 'Van', 'Mini Truck', 'Tempo'];
const VEHICLE_STATUSES = ['available', 'on_trip', 'maintenance', 'inactive'];
const DRIVER_STATUSES = ['available', 'on_delivery', 'offline'];
const ROUTE_STATUSES = ['active', 'scheduled', 'completed', 'inactive'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

function pick(arr, i) {
  return arr[i % arr.length];
}

function randomStatus(i) {
  const weights = [2, 3, 2, 4, 2, 5, 1];
  const total = weights.reduce((a, b) => a + b, 0);
  const idx = i % total;
  let sum = 0;
  for (let j = 0; j < DELIVERY_STATUSES.length; j++) {
    sum += weights[j];
    if (idx < sum) return DELIVERY_STATUSES[j];
  }
  return 'pending';
}

const DEMO_USERS = [
  {
    name: 'Rajesh Kumar',
    email: 'admin@gurunanak.com',
    phone: '+91 98765 43210',
    password: 'admin123',
    role: 'admin',
  },
  {
    name: 'Priya Sharma',
    email: 'dispatcher@gurunanak.com',
    phone: '+91 98765 43211',
    password: 'dispatch123',
    role: 'dispatcher',
  },
  {
    name: 'Vikram Singh',
    email: 'driver@gurunanak.com',
    phone: '+91 98765 43212',
    password: 'driver123',
    role: 'driver',
  },
  {
    name: 'Anita Mehta',
    email: 'customer@gurunanak.com',
    phone: '+91 98765 43213',
    password: 'customer123',
    role: 'customer',
  },
];

export async function seedIfEmpty() {
  if (!isDbConnected()) return;

  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('Database already seeded, skipping');
    return;
  }

  console.log('Seeding demo data...');

  const users = await Promise.all(
    DEMO_USERS.map(async (u) => ({
      ...u,
      email: u.email.toLowerCase(),
      password: await bcrypt.hash(u.password, 10),
    })),
  );
  await User.insertMany(users);

  const customers = await Customer.insertMany(
    Array.from({ length: 20 }, (_, i) => ({
      name: CUSTOMER_NAMES[i],
      phone: `+91 ${90000 + i * 111} ${10000 + i * 7}`,
      email: `contact${i + 1}@demo-logistics.in`,
      address: `${pick(CITIES, i)} Industrial Area, ${pick(CITIES, i + 1)}`,
      totalDeliveries: 10 + i * 5,
      activeOrders: i % 4,
      lastDelivery: `2026-0${(i % 3) + 1}-${String(10 + (i % 18)).padStart(2, '0')}`,
    })),
  );

  const vehicles = await Vehicle.insertMany(
    Array.from({ length: 15 }, (_, i) => ({
      vehicleNumber: `GNK-${pick(['TRK', 'VAN', 'MT', 'TMP'], i)}-${String(i + 1).padStart(3, '0')}`,
      registration: `${pick(['RJ', 'PB', 'DL', 'HR'], i)}-${String(i + 10).padStart(2, '0')}-AB-${1000 + i * 111}`,
      type: pick(VEHICLE_TYPES, i),
      capacity: `${1 + (i % 5) * 2}.5 Ton`,
      status: pick(VEHICLE_STATUSES, i),
      mileage: 20000 + i * 8000,
      insuranceExpiry: `2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
      lastService: `2025-${String((i % 12) + 1).padStart(2, '0')}-10`,
      nextService: `2026-${String(((i + 3) % 12) + 1).padStart(2, '0')}-10`,
    })),
  );

  const drivers = await Driver.insertMany(
    Array.from({ length: 10 }, (_, i) => ({
      name: DRIVER_NAMES[i],
      phone: `+91 9876${i} ${54320 + i}`,
      email: i === 0 ? 'driver@gurunanak.com' : `driver${i + 1}@gurunanak.com`,
      licenseNumber: `RJ-20${15 + i}-${1000000 + i * 111111}`,
      licenseExpiry: `202${7 + (i % 3)}-0${(i % 9) + 1}-15`,
      address: `${pick(CITIES, i)} Main Road`,
      vehicleId: i < 8 ? vehicles[i]._id : undefined,
      status: pick(DRIVER_STATUSES, i),
      rating: 4.2 + (i % 8) * 0.1,
      experience: 2 + i,
      totalDeliveries: 200 + i * 80,
      completedDeliveries: 190 + i * 75,
      cancelledDeliveries: 5 + (i % 10),
      currentLat: CITY_COORDS[pick(CITIES, i)][0],
      currentLng: CITY_COORDS[pick(CITIES, i)][1],
    })),
  );

  for (let i = 0; i < Math.min(10, vehicles.length); i++) {
    vehicles[i].driverId = drivers[i]._id;
    await vehicles[i].save();
  }

  const deliveries = await Delivery.insertMany(
    Array.from({ length: 20 }, (_, i) => {
      const pickupCity = pick(CITIES, i);
      const destCity = pick(CITIES, i + 3);
      const status = randomStatus(i);
      const [pickupLat, pickupLng] = CITY_COORDS[pickupCity];
      const [destLat, destLng] = CITY_COORDS[destCity];
      const progress =
        status === 'delivered'
          ? 1
          : status === 'in_transit'
            ? 0.5
            : status === 'picked_up'
              ? 0.2
              : 0.1;
      const driver =
        status !== 'pending' && status !== 'cancelled' ? drivers[i % drivers.length] : null;
      const vehicle = driver ? vehicles.find((v) => v._id.equals(driver.vehicleId)) : null;

      return {
        trackingId: `GNK202603${String(i + 1).padStart(2, '0')}${String(1000 + i)}`,
        customerId: customers[i % customers.length]._id,
        pickup: `Warehouse ${i + 1}, ${pickupCity}`,
        pickupCity,
        destination: `Delivery Point ${i + 1}, ${destCity}`,
        destinationCity: destCity,
        packageType: pick(PACKAGE_TYPES, i),
        weight: `${50 + i * 25} kg`,
        driverId: driver?._id,
        vehicleId: vehicle?._id,
        priority: pick(PRIORITIES, i),
        status,
        createdDate: '2026-03-01',
        expectedDelivery: '2026-03-08',
        eta: status === 'delivered' ? undefined : `${10 + (i % 8)}:${String((i * 7) % 60).padStart(2, '0')} IST`,
        pickupLat,
        pickupLng,
        destLat,
        destLng,
        currentLat: pickupLat + (destLat - pickupLat) * progress,
        currentLng: pickupLng + (destLng - pickupLng) * progress,
        speed: status === 'delivered' ? 0 : 55 + (i % 20),
        lastUpdated: new Date().toISOString(),
      };
    }),
  );

  await Route.insertMany(
    Array.from({ length: 10 }, (_, i) => {
      const origin = pick(CITIES, i);
      const destination = pick(CITIES, i + 4);
      return {
        routeId: `RT-${origin.slice(0, 3).toUpperCase()}-${destination.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        origin,
        destination,
        stops: [pick(CITIES, i + 1), pick(CITIES, i + 2)],
        distance: 150 + i * 45,
        estimatedTime: `${3 + (i % 6)}h ${(i * 10) % 60}m`,
        driverId: drivers[i % drivers.length]._id,
        vehicleId: vehicles[i % vehicles.length]._id,
        status: pick(ROUTE_STATUSES, i),
      };
    }),
  );

  for (let i = 0; i < 3; i++) {
    drivers[i].currentDeliveryId = deliveries[i]._id;
    await drivers[i].save();
  }

  await Notification.insertMany([
    {
      type: 'system_alert',
      title: 'Welcome to GURUNANAK Logistics',
      message: 'Demo data has been loaded successfully.',
      read: false,
    },
    {
      type: 'delivery_update',
      title: 'Deliveries Ready',
      message: `${deliveries.length} sample deliveries are available for tracking.`,
      read: false,
      deliveryId: deliveries[0]._id,
    },
  ]);

  const driverUser = await User.findOne({ email: 'driver@gurunanak.com' });
  const customerUser = await User.findOne({ email: 'customer@gurunanak.com' });
  const linkedDriver = drivers[0];
  const linkedCustomer = customers.find((c) => c.name === 'Anita Mehta') || customers[0];

  if (driverUser && linkedDriver) {
    driverUser.driverId = linkedDriver._id;
    await driverUser.save();
  }

  if (customerUser && linkedCustomer) {
    customerUser.customerId = linkedCustomer._id;
    await customerUser.save();
  }

  console.log('Seeded demo users, 20 deliveries, 10 drivers, 15 vehicles, 20 customers, 10 routes');
}
