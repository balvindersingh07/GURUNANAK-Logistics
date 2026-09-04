import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type {
  Customer,
  Delivery,
  DeliveryStatus,
  Driver,
  Notification,
  Route,
  SupportTicket,
  Vehicle,
  AppSettings,
  ProofOfDelivery,
} from '../types';
import { generateId, generateTrackingId } from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_DELIVERIES,
  INITIAL_DRIVERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ROUTES,
  INITIAL_VEHICLES,
  DEFAULT_SETTINGS,
  CITY_COORDS,
} from '../data/mockData';
import { checkApiHealth } from '../services/api';
import { deliveryService } from '../services/deliveryService';
import { driverService } from '../services/driverService';
import { fleetService } from '../services/fleetService';
import { customerService } from '../services/customerService';
import { routeService } from '../services/routeService';
import { notificationService } from '../services/notificationService';
import {
  unwrapList,
  mapDelivery,
  mapDriver,
  mapVehicle,
  mapCustomer,
  mapRoute,
  mapNotification,
  mapProof,
  type PaginatedResponse,
} from '../utils/mappers';
import { validateTransition } from '../utils/deliveryTransitions';
import { isDemoFallbackError, getErrorMessage } from '../utils/apiHelpers';
import { useSocket } from '../hooks/useSocket';

interface AppContextType {
  deliveries: Delivery[];
  drivers: Driver[];
  vehicles: Vehicle[];
  customers: Customer[];
  routes: Route[];
  notifications: Notification[];
  settings: AppSettings;
  tickets: SupportTicket[];
  proofOfDeliveries: ProofOfDelivery[];
  apiOnline: boolean;
  loading: boolean;
  error: string | null;
  retryLoad: () => void;
  addDelivery: (data: Partial<Delivery>, assign?: boolean) => Promise<Delivery>;
  updateDelivery: (id: string, data: Partial<Delivery>) => Promise<void>;
  deleteDelivery: (id: string) => Promise<void>;
  updateDeliveryStatus: (id: string, status: DeliveryStatus) => Promise<void>;
  addDriver: (data: Partial<Driver>) => Promise<Driver>;
  updateDriver: (id: string, data: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  addVehicle: (data: Partial<Vehicle>) => Promise<Vehicle>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addCustomer: (data: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addRoute: (data: Partial<Route>) => Promise<Route>;
  updateRoute: (id: string, data: Partial<Route>) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addTicket: (data: Partial<SupportTicket>) => void;
  saveProofOfDelivery: (
    deliveryId: string,
    data: { photoUrl?: string; signature?: string; notes?: string },
  ) => Promise<ProofOfDelivery>;
  getProofOfDelivery: (deliveryId: string) => ProofOfDelivery | undefined;
  updateSettings: (data: Partial<AppSettings>) => void;
  getCustomer: (id: string) => Customer | undefined;
  getDriver: (id: string) => Driver | undefined;
  getVehicle: (id: string) => Vehicle | undefined;
  getDelivery: (id: string) => Delivery | undefined;
}

const AppContext = createContext<AppContextType | null>(null);
const DATA_KEY = 'gnk_app_data';
const FETCH_LIMIT = 100;

function loadData<T>(key: string, fallback: T): T {
  try {
    const all = localStorage.getItem(DATA_KEY);
    if (!all) return fallback;
    const parsed = JSON.parse(all);
    return parsed[key] ?? fallback;
  } catch {
    return fallback;
  }
}

function saveAll(data: Record<string, unknown>) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

type StateSetters = {
  setDeliveries: Dispatch<SetStateAction<Delivery[]>>;
  setDrivers: Dispatch<SetStateAction<Driver[]>>;
  setVehicles: Dispatch<SetStateAction<Vehicle[]>>;
  setCustomers: Dispatch<SetStateAction<Customer[]>>;
  setRoutes: Dispatch<SetStateAction<Route[]>>;
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  setProofOfDeliveries: Dispatch<SetStateAction<ProofOfDelivery[]>>;
};

function localAddDelivery(
  data: Partial<Delivery>,
  assign: boolean,
  { setDeliveries, setDrivers, setVehicles }: StateSetters,
): Delivery {
  const pickupCity = data.pickupCity || 'Jaipur';
  const destCity = data.destinationCity || 'Delhi';
  const [pickupLat, pickupLng] = CITY_COORDS[pickupCity] || [26.9124, 75.7873];
  const [destLat, destLng] = CITY_COORDS[destCity] || [28.6139, 77.209];
  const delivery: Delivery = {
    id: generateId('del'),
    trackingId: generateTrackingId(),
    customerId: data.customerId || '',
    pickup: data.pickup || '',
    pickupCity,
    destination: data.destination || '',
    destinationCity: destCity,
    packageType: data.packageType || 'General',
    weight: data.weight || '100 kg',
    driverId: data.driverId,
    vehicleId: data.vehicleId,
    priority: data.priority || 'normal',
    status: assign && data.driverId ? 'assigned' : data.status || 'pending',
    createdDate: new Date().toISOString().split('T')[0],
    expectedDelivery:
      data.expectedDelivery || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    eta: '16:00 IST',
    pickupLat,
    pickupLng,
    destLat,
    destLng,
    currentLat: pickupLat,
    currentLng: pickupLng,
    speed: 0,
    lastUpdated: new Date().toISOString(),
    ...data,
  };
  setDeliveries((prev) => [delivery, ...prev]);
  if (delivery.driverId) {
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === delivery.driverId
          ? { ...d, status: 'on_delivery' as const, currentDeliveryId: delivery.id }
          : d,
      ),
    );
  }
  if (delivery.vehicleId) {
    setVehicles((prev) =>
      prev.map((v) => (v.id === delivery.vehicleId ? { ...v, status: 'on_trip' as const } : v)),
    );
  }
  return delivery;
}

function localUpdateDelivery(
  id: string,
  data: Partial<Delivery>,
  setDeliveries: Dispatch<SetStateAction<Delivery[]>>,
) {
  setDeliveries((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
}

function localDeleteDelivery(id: string, setDeliveries: Dispatch<SetStateAction<Delivery[]>>) {
  setDeliveries((prev) => prev.filter((d) => d.id !== id));
}

function localUpdateDeliveryStatus(
  id: string,
  status: DeliveryStatus,
  { setDeliveries, setDrivers, setVehicles }: StateSetters,
) {
  setDeliveries((prev) =>
    prev.map((d) => {
      if (d.id !== id) return d;
      const progress =
        status === 'picked_up'
          ? 0.15
          : status === 'in_transit'
            ? 0.5
            : status === 'out_for_delivery'
              ? 0.85
              : status === 'delivered'
                ? 1
                : 0;
      const currentLat = d.pickupLat + (d.destLat - d.pickupLat) * progress;
      const currentLng = d.pickupLng + (d.destLng - d.pickupLng) * progress;
      return {
        ...d,
        status,
        currentLat,
        currentLng,
        speed: status === 'delivered' ? 0 : 55 + Math.random() * 20,
        lastUpdated: new Date().toISOString(),
      };
    }),
  );
  if (status === 'delivered') {
    setDeliveries((prev) => {
      const del = prev.find((d) => d.id === id);
      if (del?.driverId) {
        setDrivers((drs) =>
          drs.map((dr) =>
            dr.id === del.driverId
              ? {
                  ...dr,
                  status: 'available' as const,
                  currentDeliveryId: undefined,
                  completedDeliveries: dr.completedDeliveries + 1,
                  totalDeliveries: dr.totalDeliveries + 1,
                }
              : dr,
          ),
        );
      }
      if (del?.vehicleId) {
        setVehicles((vs) =>
          vs.map((v) => (v.id === del.vehicleId ? { ...v, status: 'available' as const } : v)),
        );
      }
      return prev;
    });
  }
}

function localAddDriver(
  data: Partial<Driver>,
  setDrivers: Dispatch<SetStateAction<Driver[]>>,
): Driver {
  const driver: Driver = {
    id: generateId('d'),
    name: data.name || '',
    phone: data.phone || '',
    email: data.email || '',
    licenseNumber: data.licenseNumber || '',
    licenseExpiry: data.licenseExpiry || '',
    address: data.address || '',
    vehicleId: data.vehicleId,
    status: 'available',
    rating: 4.5,
    experience: data.experience || 0,
    totalDeliveries: 0,
    completedDeliveries: 0,
    cancelledDeliveries: 0,
    ...data,
  };
  setDrivers((prev) => [...prev, driver]);
  return driver;
}

function localUpdateDriver(
  id: string,
  data: Partial<Driver>,
  setDrivers: Dispatch<SetStateAction<Driver[]>>,
) {
  setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)));
}

function localDeleteDriver(id: string, setDrivers: Dispatch<SetStateAction<Driver[]>>) {
  setDrivers((prev) => prev.filter((d) => d.id !== id));
}

function localAddVehicle(
  data: Partial<Vehicle>,
  setVehicles: Dispatch<SetStateAction<Vehicle[]>>,
): Vehicle {
  const vehicle: Vehicle = {
    id: generateId('v'),
    vehicleNumber: data.vehicleNumber || `GNK-${Date.now().toString().slice(-4)}`,
    registration: data.registration || '',
    type: data.type || 'Truck',
    capacity: data.capacity || '5 Ton',
    driverId: data.driverId,
    status: 'available',
    mileage: data.mileage || 0,
    insuranceExpiry: data.insuranceExpiry || '',
    lastService: data.lastService || '',
    nextService: data.nextService || '',
    ...data,
  };
  setVehicles((prev) => [...prev, vehicle]);
  return vehicle;
}

function localUpdateVehicle(
  id: string,
  data: Partial<Vehicle>,
  setVehicles: Dispatch<SetStateAction<Vehicle[]>>,
) {
  setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)));
}

function localDeleteVehicle(id: string, setVehicles: Dispatch<SetStateAction<Vehicle[]>>) {
  setVehicles((prev) => prev.filter((v) => v.id !== id));
}

function localAddCustomer(
  data: Partial<Customer>,
  setCustomers: Dispatch<SetStateAction<Customer[]>>,
): Customer {
  const customer: Customer = {
    id: generateId('c'),
    name: data.name || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    totalDeliveries: 0,
    activeOrders: 0,
    ...data,
  };
  setCustomers((prev) => [...prev, customer]);
  return customer;
}

function localUpdateCustomer(
  id: string,
  data: Partial<Customer>,
  setCustomers: Dispatch<SetStateAction<Customer[]>>,
) {
  setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
}

function localDeleteCustomer(id: string, setCustomers: Dispatch<SetStateAction<Customer[]>>) {
  setCustomers((prev) => prev.filter((c) => c.id !== id));
}

function localAddRoute(data: Partial<Route>, setRoutes: Dispatch<SetStateAction<Route[]>>): Route {
  const route: Route = {
    id: generateId('r'),
    routeId: data.routeId || `RT-${Date.now().toString().slice(-6)}`,
    origin: data.origin || '',
    destination: data.destination || '',
    stops: data.stops || [],
    distance: data.distance || 0,
    estimatedTime: data.estimatedTime || '',
    driverId: data.driverId,
    vehicleId: data.vehicleId,
    status: data.status || 'scheduled',
    ...data,
  };
  setRoutes((prev) => [...prev, route]);
  return route;
}

function localUpdateRoute(
  id: string,
  data: Partial<Route>,
  setRoutes: Dispatch<SetStateAction<Route[]>>,
) {
  setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
}

function localDeleteRoute(id: string, setRoutes: Dispatch<SetStateAction<Route[]>>) {
  setRoutes((prev) => prev.filter((r) => r.id !== id));
}

function localMarkNotificationRead(
  id: string,
  setNotifications: Dispatch<SetStateAction<Notification[]>>,
) {
  setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
}

function localMarkAllNotificationsRead(setNotifications: Dispatch<SetStateAction<Notification[]>>) {
  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
}

function localDeleteNotification(
  id: string,
  setNotifications: Dispatch<SetStateAction<Notification[]>>,
) {
  setNotifications((prev) => prev.filter((n) => n.id !== id));
}

function localSaveProofOfDelivery(
  deliveryId: string,
  data: { photoUrl?: string; signature?: string; notes?: string },
  setProofOfDeliveries: Dispatch<SetStateAction<ProofOfDelivery[]>>,
): ProofOfDelivery {
  let saved: ProofOfDelivery = {
    id: generateId('pod'),
    deliveryId,
    completedAt: new Date().toISOString(),
  };

  setProofOfDeliveries((prev) => {
    const existing = prev.find((p) => p.deliveryId === deliveryId);
    saved = {
      id: existing?.id ?? generateId('pod'),
      deliveryId,
      photoUrl: data.photoUrl ?? existing?.photoUrl,
      signature: data.signature ?? existing?.signature,
      notes: data.notes ?? existing?.notes,
      completedAt: existing?.completedAt ?? new Date().toISOString(),
    };
    return [...prev.filter((p) => p.deliveryId !== deliveryId), saved];
  });

  return saved;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [deliveries, setDeliveries] = useState<Delivery[]>(() =>
    loadData('deliveries', INITIAL_DELIVERIES),
  );
  const [drivers, setDrivers] = useState<Driver[]>(() => loadData('drivers', INITIAL_DRIVERS));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadData('vehicles', INITIAL_VEHICLES));
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadData('customers', INITIAL_CUSTOMERS),
  );
  const [routes, setRoutes] = useState<Route[]>(() => loadData('routes', INITIAL_ROUTES));
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadData('notifications', INITIAL_NOTIFICATIONS),
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadData('settings', DEFAULT_SETTINGS),
  );
  const [tickets, setTickets] = useState<SupportTicket[]>(() => loadData('tickets', []));
  const [proofOfDeliveries, setProofOfDeliveries] = useState<ProofOfDelivery[]>(() =>
    loadData('proofOfDeliveries', []),
  );
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setters: StateSetters = {
    setDeliveries,
    setDrivers,
    setVehicles,
    setCustomers,
    setRoutes,
    setNotifications,
    setProofOfDeliveries,
  };

  const loadFromApi = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const healthy = await checkApiHealth();
      if (!healthy) {
        setApiOnline(false);
        return;
      }

      setApiOnline(true);
      const params = { limit: FETCH_LIMIT };
      const [delRes, drvRes, vehRes, custRes, routeRes, notifList, proofList] = await Promise.all([
        deliveryService.getAll(params),
        driverService.getAll(params),
        fleetService.getAll(params),
        customerService.getAll(params),
        routeService.getAll(params),
        notificationService.getAll(params),
        deliveryService.listProofs(),
      ]);

      setDeliveries(unwrapList(delRes as Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>).map((r) => mapDelivery(r)));
      setDrivers(unwrapList(drvRes as Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>).map((r) => mapDriver(r)));
      setVehicles(unwrapList(vehRes as Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>).map((r) => mapVehicle(r)));
      setCustomers(unwrapList(custRes as Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>).map((r) => mapCustomer(r)));
      setRoutes(unwrapList(routeRes as Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>).map((r) => mapRoute(r)));
      setNotifications(notifList);
      setProofOfDeliveries(Array.isArray(proofList) ? proofList.map((r) => mapProof(r)) : []);
    } catch (err) {
      if (isDemoFallbackError(err)) {
        setApiOnline(false);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  const retryLoad = useCallback(() => {
    loadFromApi();
  }, [loadFromApi]);

  useSocket({
    onDeliveryUpdated: (delivery) => {
      const mapped = mapDelivery(delivery as unknown as Record<string, unknown>);
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === mapped.id || d.trackingId === mapped.trackingId ? { ...d, ...mapped } : d,
        ),
      );
    },
    onLocationUpdated: (data) => {
      const payload = data as { id?: string; driverId?: string; vehicleId?: string; lat: number; lng: number; speed: number };
      const matchId = payload.id || payload.driverId || payload.vehicleId;
      if (!matchId) return;
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === matchId || d.driverId === matchId || d.vehicleId === matchId
            ? {
                ...d,
                currentLat: payload.lat,
                currentLng: payload.lng,
                speed: payload.speed,
                lastUpdated: new Date().toISOString(),
              }
            : d,
        ),
      );
    },
    onNotification: (notification) => {
      if (notification && typeof notification === 'object') {
        const mapped = mapNotification(notification as Record<string, unknown>);
        setNotifications((prev) => [mapped, ...prev]);
      }
    },
  });

  useEffect(() => {
    if (apiOnline) return;
    saveAll({
      deliveries,
      drivers,
      vehicles,
      customers,
      routes,
      notifications,
      settings,
      tickets,
      proofOfDeliveries,
    });
  }, [
    apiOnline,
    deliveries,
    drivers,
    vehicles,
    customers,
    routes,
    notifications,
    settings,
    tickets,
    proofOfDeliveries,
  ]);

  const getCustomer = useCallback((id: string) => customers.find((c) => c.id === id), [customers]);
  const getDriver = useCallback((id: string) => drivers.find((d) => d.id === id), [drivers]);
  const getVehicle = useCallback((id: string) => vehicles.find((v) => v.id === id), [vehicles]);
  const getDelivery = useCallback((id: string) => deliveries.find((d) => d.id === id), [deliveries]);

  const addDelivery = useCallback(
    async (data: Partial<Delivery>, assign = false): Promise<Delivery> => {
      if (apiOnline) {
        try {
          const payload: Partial<Delivery> = {
            ...data,
            status: assign && data.driverId ? 'assigned' : data.status || 'pending',
          };
          const created = await deliveryService.create(payload);
          setDeliveries((prev) => [created, ...prev]);
          return created;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            return localAddDelivery(data, assign, setters);
          }
          throw err;
        }
      }
      return localAddDelivery(data, assign, setters);
    },
    [apiOnline, setters],
  );

  const updateDelivery = useCallback(
    async (id: string, data: Partial<Delivery>): Promise<void> => {
      if (apiOnline) {
        try {
          const updated = await deliveryService.update(id, data);
          setDeliveries((prev) => prev.map((d) => (d.id === id ? updated : d)));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localUpdateDelivery(id, data, setDeliveries);
            return;
          }
          throw err;
        }
      }
      localUpdateDelivery(id, data, setDeliveries);
    },
    [apiOnline, setDeliveries],
  );

  const deleteDelivery = useCallback(
    async (id: string): Promise<void> => {
      if (apiOnline) {
        try {
          await deliveryService.delete(id);
          setDeliveries((prev) => prev.filter((d) => d.id !== id));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localDeleteDelivery(id, setDeliveries);
            return;
          }
          throw err;
        }
      }
      localDeleteDelivery(id, setDeliveries);
    },
    [apiOnline, setDeliveries],
  );

  const updateDeliveryStatus = useCallback(
    async (id: string, status: DeliveryStatus): Promise<void> => {
      const delivery = deliveries.find((d) => d.id === id);
      if (!delivery) throw new Error('Delivery not found');
      const transitionError = validateTransition(delivery.status, status);
      if (transitionError) throw new Error(transitionError);

      if (apiOnline) {
        try {
          const updated = await deliveryService.updateStatus(id, status);
          setDeliveries((prev) => prev.map((d) => (d.id === id ? updated : d)));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localUpdateDeliveryStatus(id, status, setters);
            return;
          }
          throw err;
        }
      }
      localUpdateDeliveryStatus(id, status, setters);
    },
    [apiOnline, deliveries, setters],
  );

  const addDriver = useCallback(
    async (data: Partial<Driver>): Promise<Driver> => {
      if (apiOnline) {
        try {
          const created = await driverService.create(data);
          setDrivers((prev) => [...prev, created]);
          return created;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            return localAddDriver(data, setDrivers);
          }
          throw err;
        }
      }
      return localAddDriver(data, setDrivers);
    },
    [apiOnline, setDrivers],
  );

  const updateDriver = useCallback(
    async (id: string, data: Partial<Driver>): Promise<void> => {
      if (apiOnline) {
        try {
          const updated = await driverService.update(id, data);
          setDrivers((prev) => prev.map((d) => (d.id === id ? updated : d)));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localUpdateDriver(id, data, setDrivers);
            return;
          }
          throw err;
        }
      }
      localUpdateDriver(id, data, setDrivers);
    },
    [apiOnline, setDrivers],
  );

  const deleteDriver = useCallback(
    async (id: string): Promise<void> => {
      if (apiOnline) {
        try {
          await driverService.delete(id);
          setDrivers((prev) => prev.filter((d) => d.id !== id));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localDeleteDriver(id, setDrivers);
            return;
          }
          throw err;
        }
      }
      localDeleteDriver(id, setDrivers);
    },
    [apiOnline, setDrivers],
  );

  const addVehicle = useCallback(
    async (data: Partial<Vehicle>): Promise<Vehicle> => {
      if (apiOnline) {
        try {
          const created = await fleetService.create(data);
          setVehicles((prev) => [...prev, created]);
          return created;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            return localAddVehicle(data, setVehicles);
          }
          throw err;
        }
      }
      return localAddVehicle(data, setVehicles);
    },
    [apiOnline, setVehicles],
  );

  const updateVehicle = useCallback(
    async (id: string, data: Partial<Vehicle>): Promise<void> => {
      if (apiOnline) {
        try {
          const updated = await fleetService.update(id, data);
          setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localUpdateVehicle(id, data, setVehicles);
            return;
          }
          throw err;
        }
      }
      localUpdateVehicle(id, data, setVehicles);
    },
    [apiOnline, setVehicles],
  );

  const deleteVehicle = useCallback(
    async (id: string): Promise<void> => {
      if (apiOnline) {
        try {
          await fleetService.delete(id);
          setVehicles((prev) => prev.filter((v) => v.id !== id));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localDeleteVehicle(id, setVehicles);
            return;
          }
          throw err;
        }
      }
      localDeleteVehicle(id, setVehicles);
    },
    [apiOnline, setVehicles],
  );

  const addCustomer = useCallback(
    async (data: Partial<Customer>): Promise<Customer> => {
      if (apiOnline) {
        try {
          const created = await customerService.create(data);
          setCustomers((prev) => [...prev, created]);
          return created;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            return localAddCustomer(data, setCustomers);
          }
          throw err;
        }
      }
      return localAddCustomer(data, setCustomers);
    },
    [apiOnline, setCustomers],
  );

  const updateCustomer = useCallback(
    async (id: string, data: Partial<Customer>): Promise<void> => {
      if (apiOnline) {
        try {
          const updated = await customerService.update(id, data);
          setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localUpdateCustomer(id, data, setCustomers);
            return;
          }
          throw err;
        }
      }
      localUpdateCustomer(id, data, setCustomers);
    },
    [apiOnline, setCustomers],
  );

  const deleteCustomer = useCallback(
    async (id: string): Promise<void> => {
      if (apiOnline) {
        try {
          await customerService.delete(id);
          setCustomers((prev) => prev.filter((c) => c.id !== id));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localDeleteCustomer(id, setCustomers);
            return;
          }
          throw err;
        }
      }
      localDeleteCustomer(id, setCustomers);
    },
    [apiOnline, setCustomers],
  );

  const addRoute = useCallback(
    async (data: Partial<Route>): Promise<Route> => {
      if (apiOnline) {
        try {
          const created = await routeService.create(data);
          setRoutes((prev) => [...prev, created]);
          return created;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            return localAddRoute(data, setRoutes);
          }
          throw err;
        }
      }
      return localAddRoute(data, setRoutes);
    },
    [apiOnline, setRoutes],
  );

  const updateRoute = useCallback(
    async (id: string, data: Partial<Route>): Promise<void> => {
      if (apiOnline) {
        try {
          const updated = await routeService.update(id, data);
          setRoutes((prev) => prev.map((r) => (r.id === id ? updated : r)));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localUpdateRoute(id, data, setRoutes);
            return;
          }
          throw err;
        }
      }
      localUpdateRoute(id, data, setRoutes);
    },
    [apiOnline, setRoutes],
  );

  const deleteRoute = useCallback(
    async (id: string): Promise<void> => {
      if (apiOnline) {
        try {
          await routeService.delete(id);
          setRoutes((prev) => prev.filter((r) => r.id !== id));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localDeleteRoute(id, setRoutes);
            return;
          }
          throw err;
        }
      }
      localDeleteRoute(id, setRoutes);
    },
    [apiOnline, setRoutes],
  );

  const markNotificationRead = useCallback(
    async (id: string): Promise<void> => {
      if (apiOnline) {
        try {
          await notificationService.markRead(id);
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localMarkNotificationRead(id, setNotifications);
            return;
          }
          throw err;
        }
      }
      localMarkNotificationRead(id, setNotifications);
    },
    [apiOnline, setNotifications],
  );

  const markAllNotificationsRead = useCallback(async (): Promise<void> => {
    if (apiOnline) {
      try {
        await notificationService.markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        return;
      } catch (err) {
        if (isDemoFallbackError(err)) {
          setApiOnline(false);
          localMarkAllNotificationsRead(setNotifications);
          return;
        }
        throw err;
      }
    }
    localMarkAllNotificationsRead(setNotifications);
  }, [apiOnline, setNotifications]);

  const deleteNotification = useCallback(
    async (id: string): Promise<void> => {
      if (apiOnline) {
        try {
          await notificationService.delete(id);
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          return;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            localDeleteNotification(id, setNotifications);
            return;
          }
          throw err;
        }
      }
      localDeleteNotification(id, setNotifications);
    },
    [apiOnline, setNotifications],
  );

  const addTicket = useCallback((data: Partial<SupportTicket>) => {
    const ticket: SupportTicket = {
      id: generateId('t'),
      subject: data.subject || '',
      category: data.category || 'General',
      message: data.message || '',
      status: 'open',
      createdAt: new Date().toISOString(),
      ...data,
    };
    setTickets((prev) => [...prev, ticket]);
  }, []);

  const updateSettings = useCallback((data: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...data }));
  }, []);

  const saveProofOfDelivery = useCallback(
    async (
      deliveryId: string,
      data: { photoUrl?: string; signature?: string; notes?: string },
    ): Promise<ProofOfDelivery> => {
      if (apiOnline) {
        try {
          const raw = await deliveryService.submitProof(deliveryId, data);
          const proof = mapProof(raw);
          setProofOfDeliveries((prev) => [
            ...prev.filter((p) => p.deliveryId !== deliveryId),
            proof,
          ]);
          return proof;
        } catch (err) {
          if (isDemoFallbackError(err)) {
            setApiOnline(false);
            return localSaveProofOfDelivery(deliveryId, data, setProofOfDeliveries);
          }
          throw err;
        }
      }
      return localSaveProofOfDelivery(deliveryId, data, setProofOfDeliveries);
    },
    [apiOnline, setProofOfDeliveries],
  );

  const getProofOfDelivery = useCallback(
    (deliveryId: string) => proofOfDeliveries.find((p) => p.deliveryId === deliveryId),
    [proofOfDeliveries],
  );

  return (
    <AppContext.Provider
      value={{
        deliveries,
        drivers,
        vehicles,
        customers,
        routes,
        notifications,
        settings,
        tickets,
        proofOfDeliveries,
        apiOnline,
        loading,
        error,
        retryLoad,
        addDelivery,
        updateDelivery,
        deleteDelivery,
        updateDeliveryStatus,
        addDriver,
        updateDriver,
        deleteDriver,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addRoute,
        updateRoute,
        deleteRoute,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        addTicket,
        saveProofOfDelivery,
        getProofOfDelivery,
        updateSettings,
        getCustomer,
        getDriver,
        getVehicle,
        getDelivery,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
