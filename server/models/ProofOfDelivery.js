import mongoose from 'mongoose';

const proofOfDeliverySchema = new mongoose.Schema(
  {
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
      required: true,
      unique: true,
    },
    photoUrl: { type: String },
    signature: { type: String },
    notes: { type: String },
    completedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

proofOfDeliverySchema.index({ completedAt: -1 });

export default mongoose.models.ProofOfDelivery ||
  mongoose.model('ProofOfDelivery', proofOfDeliverySchema);
