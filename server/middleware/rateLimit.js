import rateLimit from 'express-rate-limit';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Production defaults stay strict. Development/test use higher limits so QA bursts
 * do not cascade into 429 failures. Override with RATE_LIMIT_* env vars if needed.
 */
const authMax = Number(process.env.RATE_LIMIT_AUTH_MAX) || (isProduction ? 100 : 1000);
const apiMax = Number(process.env.RATE_LIMIT_API_MAX) || (isProduction ? 300 : 5000);

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: apiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
