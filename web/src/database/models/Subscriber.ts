import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  subscription: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema); 