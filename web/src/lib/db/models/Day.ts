import mongoose, { Schema, Document } from 'mongoose';

export interface IDay extends Document {
  title: string;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DaySchema = new Schema<IDay>({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
}, { timestamps: true });

export const Day = mongoose.models.Day || mongoose.model<IDay>('Day', DaySchema); 