import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, required: true },
    totalDeliveries: { type: Number, default: 0 },
    activeOrders: { type: Number, default: 0 },
    lastDelivery: { type: String },
  },
  { timestamps: true },
);

customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ name: 1 });

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);
