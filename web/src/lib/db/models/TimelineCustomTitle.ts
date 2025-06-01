import mongoose, { Schema, Document } from 'mongoose';

export interface ITimelineCustomTitle extends Document {
  festivalDayId: string; // Reference to central festival day
  customTitle: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineCustomTitleSchema = new Schema<ITimelineCustomTitle>({
  festivalDayId: { 
    type: String, 
    required: true, 
    unique: true // Each festival day can only have one custom title
  },
  customTitle: { 
    type: String, 
    required: true 
  },
}, { 
  timestamps: true 
});

export const TimelineCustomTitle = mongoose.models.TimelineCustomTitle || mongoose.model<ITimelineCustomTitle>('TimelineCustomTitle', TimelineCustomTitleSchema); 