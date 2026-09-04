import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'delivery_update',
        'driver_assignment',
        'vehicle_maintenance',
        'customer_update',
        'system_alert',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
