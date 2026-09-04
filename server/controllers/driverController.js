import Driver from '../models/Driver.js';
import { isDbConnected } from '../config/db.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

export async function getDrivers(req, res, next) {
  try {
    if (!isDbConnected()) return res.json([]);

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const { page, limit, skip } = parsePagination(req.query);
    const [drivers, total] = await Promise.all([
      Driver.find(filter)
        .populate('vehicleId', 'vehicleNumber type')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Driver.countDocuments(filter),
    ]);

    res.json(paginatedResponse(drivers, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getDriverById(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const driver = await Driver.findById(req.params.id).populate('vehicleId', 'vehicleNumber type');
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(driver);
  } catch (err) {
    next(err);
  }
}

export async function createDriver(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const driver = await Driver.create(req.body);
    res.status(201).json(driver);
  } catch (err) {
    next(err);
  }
}

export async function updateDriver(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(driver);
  } catch (err) {
    next(err);
  }
}

export async function deleteDriver(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ message: 'Driver deleted', id: driver._id });
  } catch (err) {
    next(err);
  }
}
