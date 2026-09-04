import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['admin', 'dispatcher', 'driver', 'customer'],
      default: 'customer',
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });

export default mongoose.models.User || mongoose.model('User', userSchema);
