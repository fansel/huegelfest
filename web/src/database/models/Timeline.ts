import mongoose from 'mongoose';
import { Category } from './Category';
import { logger } from '@/server/lib/logger';

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

// Pre-Save-Hook: Prüfe Kategorie-Referenzen
timelineSchema.pre('save', async function(next) {
  try {
    // Finde die "Sonstiges"-Kategorie
    const otherCategory = await Category.findOne({ value: 'other' }).lean().exec();
    if (!otherCategory) {
      throw new Error('Kategorie "Sonstiges" nicht gefunden');
    }

    // Prüfe für jeden Tag und jedes Event die Kategorie-Referenz
    for (const day of this.days) {
      for (const event of day.events) {
        const categoryExists = await Category.exists({ _id: event.categoryId }).lean().exec();
        if (!categoryExists) {
          logger.info(`Kategorie ${event.categoryId} nicht gefunden, weise Event "${event.title}" der "Sonstiges"-Kategorie zu`);
          event.categoryId = otherCategory._id;
        }
      }
    }
    next();
  } catch (error) {
    logger.error('Fehler beim Prüfen der Kategorie-Referenzen:', error);
    next(error);
  }
});

// Virtual für die Frontend-Darstellung
timelineSchema.virtual('daysForFrontend').get(function() {
  return this.days.map(day => ({
    ...day.toObject(),
    date: day.date.toISOString().split('T')[0]
  }));
});

// Virtuals für die Frontend-Darstellung
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