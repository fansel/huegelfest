import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEvent extends Document {
  dayId: Types.ObjectId;
  time: string;
  title: string;
  description: string;
  categoryId: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  moderationComment?: string;
  submittedAt: Date;
  submittedByAdmin?: boolean;
  offeredBy?: string;
  agendaJobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  dayId: { type: Schema.Types.ObjectId, ref: 'Day', required: true },
  time: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true },
  moderationComment: { type: String },
  submittedAt: { type: Date, required: true },
  submittedByAdmin: { type: Boolean },
  offeredBy: { type: String },
  agendaJobId: { type: String },
}, { timestamps: true });

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema); 