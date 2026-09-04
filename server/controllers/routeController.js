import Route from '../models/Route.js';
import { isDbConnected } from '../config/db.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

export async function getRoutes(req, res, next) {
  try {
    if (!isDbConnected()) return res.json([]);

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const { page, limit, skip } = parsePagination(req.query);
    const [routes, total] = await Promise.all([
      Route.find(filter)
        .populate('driverId', 'name phone')
        .populate('vehicleId', 'vehicleNumber type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Route.countDocuments(filter),
    ]);

    res.json(paginatedResponse(routes, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getRouteById(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const route = await Route.findById(req.params.id)
      .populate('driverId', 'name phone')
      .populate('vehicleId', 'vehicleNumber type');

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json(route);
  } catch (err) {
    next(err);
  }
}

export async function createRoute(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const route = await Route.create(req.body);
    res.status(201).json(route);
  } catch (err) {
    next(err);
  }
}

export async function updateRoute(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json(route);
  } catch (err) {
    next(err);
  }
}

export async function deleteRoute(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json({ message: 'Route deleted', id: route._id });
  } catch (err) {
    next(err);
  }
}
