import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Delivery } from '../types';
import { getToken } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

function getSocket(): Socket {
  const token = getToken();
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: { token: token ?? '' },
      transports: ['websocket', 'polling'],
    });
  } else {
    socket.auth = { token: token ?? '' };
  }
  return socket;
}

export interface LocationPayload {
  id?: string;
  driverId?: string;
  vehicleId?: string;
  deliveryId?: string;
  lat: number;
  lng: number;
  speed: number;
}

export function useSocket(handlers?: {
  onDeliveryUpdated?: (delivery: Delivery) => void;
  onLocationUpdated?: (data: LocationPayload) => void;
  onNotification?: (notification: unknown) => void;
}) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const s = getSocket();
    if (s.connected) {
      s.disconnect();
    }
    s.connect();

    const onUpdated = (delivery: Delivery) => handlersRef.current?.onDeliveryUpdated?.(delivery);

    const onStatusChanged = (payload: Delivery | { id: string; status: string; delivery?: Delivery }) => {
      const delivery =
        payload && typeof payload === 'object' && 'delivery' in payload && payload.delivery
          ? payload.delivery
          : (payload as Delivery);
      handlersRef.current?.onDeliveryUpdated?.(delivery);
    };

    const onLocation = (data: LocationPayload) => handlersRef.current?.onLocationUpdated?.(data);
    const onNotif = (n: unknown) => handlersRef.current?.onNotification?.(n);

    s.on('delivery:updated', onUpdated);
    s.on('delivery:statusChanged', onStatusChanged);
    s.on('driver:locationUpdated', onLocation);
    s.on('vehicle:locationUpdated', onLocation);
    s.on('notification:new', onNotif);

    return () => {
      s.off('delivery:updated', onUpdated);
      s.off('delivery:statusChanged', onStatusChanged);
      s.off('driver:locationUpdated', onLocation);
      s.off('vehicle:locationUpdated', onLocation);
      s.off('notification:new', onNotif);
    };
  }, []);

  return {
    subscribe: (trackingId: string) => {
      const token = getToken();
      if (!token) return;
      getSocket().emit('track:subscribe', trackingId);
    },
    disconnect: () => getSocket().disconnect(),
  };
}

export default getSocket;
