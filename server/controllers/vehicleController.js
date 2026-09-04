import Vehicle from '../models/Vehicle.js';
import { isDbConnected } from '../config/db.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

export async function getVehicles(req, res, next) {
  try {
    if (!isDbConnected()) return res.json([]);

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { vehicleNumber: { $regex: req.query.search, $options: 'i' } },
        { registration: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const { page, limit, skip } = parsePagination(req.query);
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate('driverId', 'name phone')
        .sort({ vehicleNumber: 1 })
        .skip(skip)
        .limit(limit),
      Vehicle.countDocuments(filter),
    ]);

    res.json(paginatedResponse(vehicles, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getVehicleById(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const vehicle = await Vehicle.findById(req.params.id).populate('driverId', 'name phone');
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (err) {
    next(err);
  }
}

export async function createVehicle(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (err) {
    next(err);
  }
}

export async function updateVehicle(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (err) {
    next(err);
  }
}

export async function deleteVehicle(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted', id: vehicle._id });
  } catch (err) {
    next(err);
  }
}
