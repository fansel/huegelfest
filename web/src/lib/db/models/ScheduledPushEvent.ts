import mongoose, { Document, Model } from 'mongoose';

export interface IScheduledPushEvent extends Document {
  title: string;
  body: string;
  repeat: 'once' | 'recurring';
  schedule: string | Date; // Cron-String ODER konkretes Datum
  active: boolean;
  subscribers: mongoose.Types.ObjectId[];
  agendaJobId?: string;
  createdAt: Date;
  updatedAt: Date;
  sendToAll?: boolean;
}

const scheduledPushEventSchema = new mongoose.Schema<IScheduledPushEvent>({
  title: { type: String, required: true },
  body: { type: String, required: true },
  repeat: { type: String, enum: ['once', 'recurring'], default: 'once' },
  schedule: { type: mongoose.Schema.Types.Mixed, required: true }, // Date für einmalig, String für Cron
  active: { type: Boolean, default: true },
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subscriber', default: [] }],
  agendaJobId: { type: String },
  sendToAll: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const ScheduledPushEvent: Model<IScheduledPushEvent> =
  mongoose.models.ScheduledPushEvent ||
  mongoose.model<IScheduledPushEvent>('ScheduledPushEvent', scheduledPushEventSchema);

export default ScheduledPushEvent;
