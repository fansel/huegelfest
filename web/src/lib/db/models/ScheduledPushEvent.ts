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
  groupId?: mongoose.Types.ObjectId; // For dynamic group-based push notifications
  type: 'general' | 'user' | 'group';  // Art der Nachricht
  targetUserId?: string;               // Für user-spezifische Nachrichten
  data?: Record<string, any>;          // Für beliebige Zusatzdaten
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
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // For dynamic group resolution
  type: { 
    type: String, 
    enum: ['general', 'user', 'group'], 
    required: true,
    default: 'general'
  },
  targetUserId: { type: String },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
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

// Index für schnellere Abfragen
scheduledPushEventSchema.index({ type: 1, targetUserId: 1 });
scheduledPushEventSchema.index({ type: 1, groupId: 1 });

const ScheduledPushEvent: Model<IScheduledPushEvent> =
  mongoose.models.ScheduledPushEvent ||
  mongoose.model<IScheduledPushEvent>('ScheduledPushEvent', scheduledPushEventSchema);

export default ScheduledPushEvent;
