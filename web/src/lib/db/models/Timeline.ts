import mongoose from 'mongoose';
import { Category } from './Category';
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
    required: true
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
    required: true
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
          event.categoryId = otherCategory._id;
        }
      }
    }
    next();
  } catch (error) {
    next(error);
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

const Timeline = mongoose.models?.Timeline || mongoose.model('Timeline', timelineSchema);

export { Timeline }; 