import { enrichRequestUser } from '../utils/userContext.js';

export async function enrichUser(req, _res, next) {
  try {
    await enrichRequestUser(req);
    next();
  } catch (err) {
    next(err);
  }
}
