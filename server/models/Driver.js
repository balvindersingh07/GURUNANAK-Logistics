import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    licenseNumber: { type: String, required: true, unique: true },
    licenseExpiry: { type: String, required: true },
    address: { type: String, required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    currentDeliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
    status: {
      type: String,
      enum: ['available', 'on_delivery', 'offline'],
      default: 'available',
    },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    experience: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 },
    cancelledDeliveries: { type: Number, default: 0 },
    avatar: { type: String },
    currentLat: { type: Number },
    currentLng: { type: Number },
    lastLocationUpdate: { type: Date },
  },
  { timestamps: true },
);

driverSchema.index({ email: 1 });
driverSchema.index({ status: 1 });

export default mongoose.models.Driver || mongoose.model('Driver', driverSchema);
