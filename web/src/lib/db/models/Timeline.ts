import mongoose, { Model, Document } from 'mongoose';
import { Category } from './Category';
import type { Day } from '@/features/timeline/types/types';
import { Types } from 'mongoose';
// logger ggf. aus web/src/lib/logger importieren, falls benötigt

const eventSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false,
    default: ''
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }
}, {
  _id: true,
  id: false,
  strict: true
});

const daySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  events: {
    type: [eventSchema],
    default: []
  }
}, {
  _id: true,
  id: false,
  strict: true,
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

const timelineSchema = new mongoose.Schema({
  days: {
    type: [daySchema],
    required: true,
    default: []
  }
}, {
  timestamps: true,
  strict: true,
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

export type ITimelineDocument = Document & { days: Day[] };

timelineSchema.pre('save', async function(next) {
  try {
    const otherCategory = await Category.findOne({ value: 'other' }).lean().exec();
    if (!otherCategory) {
      throw new Error('Kategorie "Sonstiges" nicht gefunden');
    }
    for (const day of this.days) {
      for (const event of day.events) {
        const categoryExists = await Category.exists({ _id: event.categoryId }).lean().exec();
        if (!categoryExists) {
          event.categoryId = new Types.ObjectId(otherCategory._id.toString());
        }
      }
    }
    next();
  } catch (error) {
    next(error as import('mongoose').CallbackError);
  }
});

timelineSchema.virtual('daysForFrontend').get(function() {
  return this.days.map(day => ({
    ...day.toObject(),
    date: day.date.toISOString().split('T')[0]
  }));
});

daySchema.virtual('formattedDate').get(function() {
  if (!this.date) return '';
  return new Date(this.date).toLocaleDateString('de-DE', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const Timeline: Model<ITimelineDocument> = mongoose.models?.Timeline || mongoose.model<ITimelineDocument>('Timeline', timelineSchema);

export { Timeline }; 