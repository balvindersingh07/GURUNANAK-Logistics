import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema(
  {
    routeId: { type: String, required: true, unique: true, trim: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    stops: [{ type: String }],
    distance: { type: Number, required: true },
    estimatedTime: { type: String, required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    status: {
      type: String,
      enum: ['active', 'scheduled', 'completed', 'inactive'],
      default: 'scheduled',
    },
  },
  { timestamps: true },
);

routeSchema.index({ status: 1 });
routeSchema.index({ origin: 1, destination: 1 });

export default mongoose.models.Route || mongoose.model('Route', routeSchema);
