import Driver from '../models/Driver.js';
import Customer from '../models/Customer.js';

/** Resolve linked driver/customer IDs for JWT user by email */
export async function resolveUserLinks(user) {
  const links = { customerId: user.customerId, driverId: user.driverId };

  if (user.role === 'driver' && !links.driverId) {
    const driver = await Driver.findOne({ email: user.email?.toLowerCase() });
    if (driver) links.driverId = driver._id.toString();
  }

  if (user.role === 'customer' && !links.customerId) {
    const customer = await Customer.findOne({ email: user.email?.toLowerCase() });
    if (customer) links.customerId = customer._id.toString();
  }

  return links;
}

export async function enrichRequestUser(req) {
  if (!req.user) return;
  const links = await resolveUserLinks(req.user);
  req.user = { ...req.user, ...links };
}
