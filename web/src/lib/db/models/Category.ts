import mongoose, { Schema, Document } from 'mongoose';
import { logger } from '@/server/lib/logger';

export interface ICategory extends Document {
  name: string;
  label: string;
  value: string;
  icon: string;
  color: string;
  description: string;
  isDefault?: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    label: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
      unique: true,
    },
    icon: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          // Erlaube lucide-react Icon-Namen (z.B. Music, Utensils, Gamepad2, HelpCircle) und alte Fa-Icons
          return /^[A-Za-z0-9]+$/.test(v);
        },
        message: 'Icon muss ein gültiger lucide-react Icon-Name sein (z.B. Music, Utensils, Gamepad2, HelpCircle) oder ein alter Fa-Name.'
      }
    },
    color: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Stelle sicher, dass der Name und der Wert eindeutig sind
categorySchema.pre('save', async function(next) {
  const existingCategory = await mongoose
    .model('Category')
    .findOne({
      $or: [
        { name: this.name, _id: { $ne: this._id } },
        { value: this.value, _id: { $ne: this._id } },
      ],
    });

  if (existingCategory) {
    throw new Error('Eine Kategorie mit diesem Namen oder Wert existiert bereits');
  }

  next();
});

// Stelle sicher, dass das Model nur einmal erstellt wird
let Category: mongoose.Model<ICategory>;

try {
  // Versuche das existierende Model zu laden
  Category = mongoose.model<ICategory>('Category');
} catch {
  // Wenn das Model noch nicht existiert, erstelle es
  Category = mongoose.model<ICategory>('Category', categorySchema);
}

export { Category }; 