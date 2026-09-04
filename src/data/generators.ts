import type { Customer, Delivery, Driver, Route, Vehicle, DeliveryStatus, Priority, VehicleType, VehicleStatus, DriverStatus, RouteStatus } from '../types';

export const CITIES = [
  'Jaipur',
  'Sri Ganganagar',
  'Hanumangarh',
  'Bikaner',
  'Jodhpur',
  'Delhi',
  'Ludhiana',
  'Chandigarh',
  'Amritsar',
] as const;

export const CITY_COORDS: Record<string, [number, number]> = {
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
  'Anita Mehta', 'Sharma Electronics Pvt Ltd', 'Rajasthan Agro Supplies', 'Punjab Textile Mills',
  'Delhi Fresh Foods', 'Ganganagar Traders', 'Jodhpur Handicrafts', 'Bikaner Salt Works',
  'Ludhiana Auto Parts', 'Chandigarh Pharma', 'Amritsar Spices Co', 'Hanumangarh Grains',
  'Jaipur Gems Export', 'Delhi Tech Solutions', 'Rajasthan Dairy', 'Punjab Cotton Mills',
  'Sri Ganganagar Fertilizers', 'Jodhpur Furniture Hub', 'Bikaner Solar Energy', 'Delhi E-Commerce Hub',
];

const DRIVER_NAMES = [
  'Vikram Singh', 'Suresh Patel', 'Ramesh Yadav', 'Harpreet Kaur', 'Mohit Agarwal',
  'Deepak Sharma', 'Gurpreet Singh', 'Amit Verma', 'Sanjay Meena', 'Kuldeep Rajput',
];

const PACKAGE_TYPES = ['Electronics', 'Agriculture', 'Textiles', 'Food & Beverages', 'Industrial Parts', 'Pharmaceuticals', 'Furniture'];
const STATUSES: DeliveryStatus[] = ['pending', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'];
const VEHICLE_TYPES: VehicleType[] = ['Truck', 'Van', 'Mini Truck', 'Tempo'];
const VEHICLE_STATUSES: VehicleStatus[] = ['available', 'on_trip', 'maintenance', 'inactive'];
const DRIVER_STATUSES: DriverStatus[] = ['available', 'on_delivery', 'offline'];

function pick<T>(arr: readonly T[] | T[], i: number): T {
  return arr[i % arr.length];
}

function randomStatus(i: number): DeliveryStatus {
  const weights = [2, 3, 2, 4, 2, 5, 1];
  const idx = i % weights.reduce((a, b) => a + b, 0);
  let sum = 0;
  for (let j = 0; j < STATUSES.length; j++) {
    sum += weights[j];
    if (idx < sum) return STATUSES[j];
  }
  return 'pending';
}

export function generateCustomers(count = 20): Customer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    name: CUSTOMER_NAMES[i],
    phone: `+91 ${90000 + i * 111} ${10000 + i * 7}`,
    email: `contact${i + 1}@demo-logistics.in`,
    address: `${pick(CITIES, i)} Industrial Area, ${pick(CITIES, i + 1)}`,
    totalDeliveries: 10 + i * 5,
    activeOrders: i % 4,
    lastDelivery: `2026-0${(i % 3) + 1}-${10 + (i % 18)}`,
  }));
}

export function generateDrivers(count = 10): Driver[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `d${i + 1}`,
    name: DRIVER_NAMES[i],
    phone: `+91 9876${i} ${54320 + i}`,
    email: i === 0 ? 'driver@gurunanak.com' : `driver${i + 1}@gurunanak.com`,
    licenseNumber: `RJ-20${15 + i}-${1000000 + i * 111111}`,
    licenseExpiry: `202${7 + (i % 3)}-0${(i % 9) + 1}-15`,
    address: `${pick(CITIES, i)} Main Road`,
    vehicleId: i < 8 ? `v${i + 1}` : undefined,
    currentDeliveryId: i < 3 ? `del${i + 1}` : undefined,
    status: pick(DRIVER_STATUSES, i),
    rating: 4.2 + (i % 8) * 0.1,
    experience: 2 + i,
    totalDeliveries: 200 + i * 80,
    completedDeliveries: 190 + i * 75,
    cancelledDeliveries: 5 + (i % 10),
  }));
}

export function generateVehicles(count = 15): Vehicle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `v${i + 1}`,
    vehicleNumber: `GNK-${pick(['TRK', 'VAN', 'MT', 'TMP'], i)}-${String(i + 1).padStart(3, '0')}`,
    registration: `${pick(['RJ', 'PB', 'DL', 'HR'], i)}-${String(i + 10).padStart(2, '0')}-AB-${1000 + i * 111}`,
    type: pick(VEHICLE_TYPES, i),
    capacity: `${1 + (i % 5) * 2}.5 Ton`,
    driverId: i < 10 ? `d${i + 1}` : undefined,
    status: pick(VEHICLE_STATUSES, i),
    mileage: 20000 + i * 8000,
    insuranceExpiry: `2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
    lastService: `2025-${String((i % 12) + 1).padStart(2, '0')}-10`,
    nextService: `2026-${String(((i + 3) % 12) + 1).padStart(2, '0')}-10`,
  }));
}

export function generateDeliveries(count = 20, customers: Customer[], drivers: Driver[], vehicles: Vehicle[]): Delivery[] {
  return Array.from({ length: count }, (_, i) => {
    const pickupCity = pick(CITIES, i);
    const destCity = pick(CITIES, i + 3);
    const status = randomStatus(i);
    const [pickupLat, pickupLng] = CITY_COORDS[pickupCity];
    const [destLat, destLng] = CITY_COORDS[destCity];
    const progress = status === 'delivered' ? 1 : status === 'in_transit' ? 0.5 : status === 'picked_up' ? 0.2 : 0.1;
    const driver = status !== 'pending' && status !== 'cancelled' ? drivers[i % drivers.length] : undefined;
    const vehicle = driver?.vehicleId ? vehicles.find((v) => v.id === driver.vehicleId) : undefined;

    return {
      id: `del${i + 1}`,
      trackingId: `GNK202603${String(i + 1).padStart(2, '0')}${String(1000 + i)}`,
      customerId: customers[i % customers.length].id,
      pickup: `Warehouse ${i + 1}, ${pickupCity}`,
      pickupCity,
      destination: `Delivery Point ${i + 1}, ${destCity}`,
      destinationCity: destCity,
      packageType: pick(PACKAGE_TYPES, i),
      weight: `${50 + i * 25} kg`,
      driverId: driver?.id,
      vehicleId: vehicle?.id,
      priority: pick(['low', 'normal', 'high', 'urgent'] as Priority[], i),
      status,
      createdDate: '2026-03-01',
      expectedDelivery: '2026-03-08',
      eta: status === 'delivered' ? undefined : `${10 + (i % 8)}:${(i * 7) % 60} IST`,
      pickupLat,
      pickupLng,
      destLat,
      destLng,
      currentLat: pickupLat + (destLat - pickupLat) * progress,
      currentLng: pickupLng + (destLng - pickupLng) * progress,
      speed: status === 'delivered' ? 0 : 55 + (i % 20),
      lastUpdated: new Date().toISOString(),
    };
  });
}

export function generateRoutes(count = 10, drivers: Driver[], vehicles: Vehicle[]): Route[] {
  return Array.from({ length: count }, (_, i) => {
    const origin = pick(CITIES, i);
    const destination = pick(CITIES, i + 4);
    return {
      id: `r${i + 1}`,
      routeId: `RT-${origin.slice(0, 3).toUpperCase()}-${destination.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
      origin,
      destination,
      stops: [pick(CITIES, i + 1), pick(CITIES, i + 2)],
      distance: 150 + i * 45,
      estimatedTime: `${3 + (i % 6)}h ${(i * 10) % 60}m`,
      driverId: drivers[i % drivers.length]?.id,
      vehicleId: vehicles[i % vehicles.length]?.id,
      status: pick(['active', 'scheduled', 'completed', 'inactive'] as RouteStatus[], i),
    };
  });
}
