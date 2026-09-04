import Customer from '../models/Customer.js';
import { isDbConnected } from '../config/db.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

export async function getCustomers(req, res, next) {
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
    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Customer.countDocuments(filter),
    ]);

    res.json(paginatedResponse(customers, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted', id: customer._id });
  } catch (err) {
    next(err);
  }
}
