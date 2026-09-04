import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = Number(process.env.PORT) || 5000;
export const JWT_SECRET = required('JWT_SECRET');
export const MONGODB_URI = process.env.MONGODB_URI || '';

export const CORS_ORIGIN = (() => {
  const origin = process.env.CORS_ORIGIN;

  if (NODE_ENV === 'production') {
    if (!origin || origin === '*') {
      throw new Error(
        'CORS_ORIGIN must be set to an explicit origin (or comma-separated list) in production',
      );
    }
    return origin;
  }

  return origin || '*';
})();
