import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';

import { PORT, CORS_ORIGIN } from './config/env.js';
import { connectDB, isDbConnected } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authLimiter, apiLimiter } from './middleware/rateLimit.js';
import authRoutes from './routes/authRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { seedIfEmpty } from './services/seedData.js';
import { startTrackingSimulator } from './services/trackingSimulator.js';
import { setupSocket } from './socket/index.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',') },
});

app.set('io', io);

app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '2mb' }));
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'GURUNANAK Logistics API',
    mongo: isDbConnected(),
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('*', (_req, res) => {
  res.json({ message: 'GURUNANAK Logistics API', docs: '/api/health' });
});

app.use(errorHandler);

setupSocket(io);

async function bootstrap() {
  const connected = await connectDB();
  if (connected) {
    await seedIfEmpty();
    startTrackingSimulator(io);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`GURUNANAK API running on http://0.0.0.0:${PORT}`);
  });
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  bootstrap().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { app, server, io };
