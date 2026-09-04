import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
  {
    trackingId: { type: String, required: true, unique: true, trim: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    pickup: { type: String, required: true },
    pickupCity: { type: String, required: true },
    destination: { type: String, required: true },
    destinationCity: { type: String, required: true },
    packageType: { type: String, required: true },
    weight: { type: String, required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: [
        'pending',
        'assigned',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    createdDate: { type: String, required: true },
    expectedDelivery: { type: String, required: true },
    eta: { type: String },
    pickupLat: { type: Number, required: true },
    pickupLng: { type: Number, required: true },
    destLat: { type: Number, required: true },
    destLng: { type: Number, required: true },
    currentLat: { type: Number },
    currentLng: { type: Number },
    speed: { type: Number, default: 0 },
    lastUpdated: { type: String },
  },
  { timestamps: true },
);

deliverySchema.index({ status: 1 });
deliverySchema.index({ driverId: 1 });
deliverySchema.index({ customerId: 1 });
deliverySchema.index({ vehicleId: 1 });
deliverySchema.index({ createdAt: -1 });

export default mongoose.models.Delivery || mongoose.model('Delivery', deliverySchema);
