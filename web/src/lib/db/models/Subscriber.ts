import mongoose, { Document, Model } from 'mongoose';

interface ISubscriber extends Document {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceId: string;
  createdAt: Date;
}

const subscriberSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  deviceId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

let Subscriber: Model<ISubscriber>;
try {
  Subscriber = mongoose.model<ISubscriber>('Subscriber');
} catch {
  Subscriber = mongoose.model<ISubscriber>('Subscriber', subscriberSchema);
}

export { Subscriber }; 