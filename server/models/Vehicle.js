import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: { type: String, required: true, unique: true, trim: true },
    registration: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      enum: ['Truck', 'Van', 'Mini Truck', 'Tempo'],
      required: true,
    },
    capacity: { type: String, required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    status: {
      type: String,
      enum: ['available', 'on_trip', 'maintenance', 'inactive'],
      default: 'available',
    },
    mileage: { type: Number, default: 0 },
    insuranceExpiry: { type: String, required: true },
    lastService: { type: String, required: true },
    nextService: { type: String, required: true },
    currentLat: { type: Number },
    currentLng: { type: Number },
    lastLocationUpdate: { type: Date },
  },
  { timestamps: true },
);

vehicleSchema.index({ status: 1 });
vehicleSchema.index({ driverId: 1 });

export default mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
