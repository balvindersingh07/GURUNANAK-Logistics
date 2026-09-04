import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { JWT_SECRET } from '../config/env.js';
import { isDbConnected } from '../config/db.js';
import { resolveUserLinks } from '../utils/userContext.js';

async function buildTokenPayload(user) {
  const links = await resolveUserLinks(user);
  return {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
    customerId: links.customerId?.toString?.() || links.customerId,
    driverId: links.driverId?.toString?.() || links.driverId,
  };
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function formatUser(user, links = {}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    customerId: links.customerId?.toString?.() || user.customerId?.toString(),
    driverId: links.driverId?.toString?.() || user.driverId?.toString(),
  };
}

export async function register(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { name, email, phone, password, role } = req.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashed,
      role,
    });

    res.status(201).json({ message: 'Account created', userId: user._id });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = await buildTokenPayload(user);
    const token = signToken(payload);
    res.json({ token, user: formatUser(user, payload) });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const links = await resolveUserLinks(user);
    res.json({ user: formatUser(user, links) });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+resetPasswordToken +resetPasswordExpires',
    );

    const genericMessage =
      'If the account exists, a password reset request has been processed.';

    if (!user) {
      return res.json({ message: genericMessage });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const response = { message: genericMessage };
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_PROVIDER) {
      response.resetToken = resetToken;
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires +password');

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
}
