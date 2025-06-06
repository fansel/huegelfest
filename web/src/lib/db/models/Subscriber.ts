import mongoose, { Document, Model } from 'mongoose';

interface ISubscriber extends Document {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string; // Optional: Wenn gesetzt, ist es eine user-gebundene Subscription. Sonst allgemeine/"anonyme" Subscription.
  createdAt: Date;
}

const subscriberSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  userId: { type: String, required: false }, // Optional für allgemeine Subscriptions
  createdAt: { type: Date, default: Date.now }
});

// Index for faster user-based queries
subscriberSchema.index({ userId: 1 });

let Subscriber: Model<ISubscriber>;
try {
  Subscriber = mongoose.model<ISubscriber>('Subscriber');
} catch {
  Subscriber = mongoose.model<ISubscriber>('Subscriber', subscriberSchema);
}

export { Subscriber }; 