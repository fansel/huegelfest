import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFestivalDay extends Document {
  date: Date;
  label: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FestivalDaySchema = new Schema<IFestivalDay>({
    date: {
      type: Date,
      required: true,
      unique: true,
    index: true 
    },
    label: {
      type: String,
      required: true,
    trim: true 
    },
    description: {
      type: String,
    trim: true 
    },
    isActive: {
      type: Boolean,
    default: true 
    },
    order: {
      type: Number,
      required: true,
    default: 1,
    index: true 
  },
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

// Compound Index für bessere Performance bei Abfragen
FestivalDaySchema.index({ isActive: 1, order: 1 });

export const FestivalDay: Model<IFestivalDay> = mongoose.models.FestivalDay || mongoose.model<IFestivalDay>('FestivalDay', FestivalDaySchema); 