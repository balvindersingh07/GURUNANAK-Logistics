import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { resolveUserLinks } from '../utils/userContext.js';
import { assertDeliveryAccess, findDeliveryByIdOrTracking } from '../utils/deliveryAccess.js';

async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      return next(new Error('Authentication required'));
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const links = await resolveUserLinks(payload);
    socket.user = {
      ...payload,
      id: payload.id,
      role: payload.role,
      customerId: links.customerId?.toString?.() || links.customerId,
      driverId: links.driverId?.toString?.() || links.driverId,
    };
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}

export function setupSocket(io) {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log('Authenticated client connected:', socket.id, socket.user?.role);

    socket.on('track:subscribe', async (payload, callback) => {
      try {
        const id =
          typeof payload === 'string' ? payload : payload?.deliveryId || payload?.trackingId;
        if (!id) {
          const error = 'Delivery id required';
          socket.emit('track:error', { error });
          if (typeof callback === 'function') callback({ error });
          return;
        }

        const delivery = await findDeliveryByIdOrTracking(id);
        const access = assertDeliveryAccess({ user: socket.user }, delivery);
        if (!access.ok) {
          socket.emit('track:error', { error: access.error });
          if (typeof callback === 'function') callback({ error: access.error });
          return;
        }

        socket.join(`delivery:${delivery._id}`);
        socket.join(`track:${delivery.trackingId}`);
        console.log(`Socket ${socket.id} subscribed to delivery:${delivery._id}`);

        if (typeof callback === 'function') callback({ ok: true });
      } catch {
        const error = 'Subscription failed';
        socket.emit('track:error', { error });
        if (typeof callback === 'function') callback({ error });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
