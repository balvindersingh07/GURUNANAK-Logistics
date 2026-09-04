import Notification from '../models/Notification.js';
import { isDbConnected } from '../config/db.js';
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

function canModifyNotification(req, notification) {
  if (!notification) return { ok: false, status: 404, error: 'Notification not found' };

  if (req.user.role === 'admin' || req.user.role === 'dispatcher') {
    return { ok: true };
  }

  const ownerId = notification.userId?.toString();
  if (ownerId && ownerId !== req.user.id) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  if (ownerId && ownerId === req.user.id) {
    return { ok: true };
  }

  // Legacy/global notifications without userId remain modifiable by non-admin viewers
  if (!ownerId) {
    return { ok: true };
  }

  return { ok: false, status: 403, error: 'Forbidden' };
}

export async function getNotifications(req, res, next) {
  try {
    if (!isDbConnected()) return res.json([]);

    const filter = {};
    if (req.user.role !== 'admin' && req.user.role !== 'dispatcher') {
      filter.$or = [{ userId: req.user.id }, { userId: { $exists: false } }, { userId: null }];
    }

    const { page, limit, skip } = parsePagination(req.query);
    const [items, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
    ]);

    res.json(paginatedResponse(items, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    if (!isDbConnected()) return res.status(503).json({ error: 'Database not configured' });

    const existing = await Notification.findById(req.params.id);
    const access = canModifyNotification(req, existing);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    existing.read = true;
    await existing.save();
    res.json(existing);
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    if (!isDbConnected()) return res.status(503).json({ error: 'Database not configured' });

    await Notification.updateMany(
      req.user.role === 'admin' || req.user.role === 'dispatcher'
        ? {}
        : { $or: [{ userId: req.user.id }, { userId: { $exists: false } }] },
      { read: true },
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(req, res, next) {
  try {
    if (!isDbConnected()) return res.status(503).json({ error: 'Database not configured' });

    const existing = await Notification.findById(req.params.id);
    const access = canModifyNotification(req, existing);
    if (!access.ok) {
      return res.status(access.status).json({ error: access.error });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted', id: existing._id });
  } catch (err) {
    next(err);
  }
}
