import mongoose, { Document, Schema } from 'mongoose';

export interface IFestivalDay extends Document {
  date: Date;
  label: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const festivalDaySchema = new Schema<IFestivalDay>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
festivalDaySchema.index({ date: 1 });
festivalDaySchema.index({ order: 1 });
festivalDaySchema.index({ isActive: 1, order: 1 });

export const FestivalDay = mongoose.models.FestivalDay || mongoose.model<IFestivalDay>('FestivalDay', festivalDaySchema); 