import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityCategory extends Document {
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const activityCategorySchema = new Schema<IActivityCategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          // Lucide-react Icon-Namen (z.B. Utensils, Broom, ShoppingCart)
          return /^[A-Za-z0-9]+$/.test(v);
        },
        message: 'Icon muss ein gültiger lucide-react Icon-Name sein (z.B. Utensils, Broom, ShoppingCart).'
      }
    },
    color: {
      type: String,
      required: true,
      default: '#ff9900',
      validate: {
        validator: function(v: string) {
          // Hex color validation
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Farbe muss ein gültiger Hex-Code sein (z.B. #ff9900).'
      }
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

// Eindeutigkeit des Namens sicherstellen
activityCategorySchema.pre('save', async function(next) {
  const existingCategory = await mongoose
    .model('ActivityCategory')
    .findOne({
      name: this.name,
      _id: { $ne: this._id }
    });

  if (existingCategory) {
    throw new Error('Eine Aktivitäts-Kategorie mit diesem Namen existiert bereits');
  }

  next();
});

// Model nur einmal erstellen
let ActivityCategory: mongoose.Model<IActivityCategory>;

try {
  ActivityCategory = mongoose.model<IActivityCategory>('ActivityCategory');
} catch {
  ActivityCategory = mongoose.model<IActivityCategory>('ActivityCategory', activityCategorySchema);
}

export { ActivityCategory }; 