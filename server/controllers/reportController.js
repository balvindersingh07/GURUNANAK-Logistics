import Delivery from '../models/Delivery.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Customer from '../models/Customer.js';
import Route from '../models/Route.js';
import { isDbConnected } from '../config/db.js';

export async function getSummary(_req, res, next) {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const [
      totalDeliveries,
      statusBreakdown,
      totalDrivers,
      availableDrivers,
      totalVehicles,
      availableVehicles,
      totalCustomers,
      totalRoutes,
      activeRoutes,
      recentDeliveries,
    ] = await Promise.all([
      Delivery.countDocuments(),
      Delivery.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Driver.countDocuments(),
      Driver.countDocuments({ status: 'available' }),
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'available' }),
      Customer.countDocuments(),
      Route.countDocuments(),
      Route.countDocuments({ status: 'active' }),
      Delivery.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('trackingId status destinationCity createdDate priority'),
    ]);

    const deliveriesByStatus = statusBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const delivered = deliveriesByStatus.delivered || 0;
    const cancelled = deliveriesByStatus.cancelled || 0;
    const inProgress =
      (deliveriesByStatus.in_transit || 0) +
      (deliveriesByStatus.out_for_delivery || 0) +
      (deliveriesByStatus.picked_up || 0) +
      (deliveriesByStatus.assigned || 0);

    res.json({
      summary: {
        totalDeliveries,
        delivered,
        cancelled,
        inProgress,
        pending: deliveriesByStatus.pending || 0,
        totalDrivers,
        availableDrivers,
        totalVehicles,
        availableVehicles,
        totalCustomers,
        totalRoutes,
        activeRoutes,
        deliveryRate: totalDeliveries ? Math.round((delivered / totalDeliveries) * 100) : 0,
      },
      deliveriesByStatus,
      recentDeliveries,
    });
  } catch (err) {
    next(err);
  }
}
