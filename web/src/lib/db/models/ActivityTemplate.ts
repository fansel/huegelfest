import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityTemplate extends Document {
  name: string;
  categoryId: Types.ObjectId;
  defaultDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const activityTemplateSchema = new Schema<IActivityTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ActivityCategory',
      required: true,
    },
    defaultDescription: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Eindeutigkeit von Name + Kategorie sicherstellen
activityTemplateSchema.pre('save', async function(next) {
  const existingTemplate = await mongoose
    .model('ActivityTemplate')
    .findOne({
      name: this.name,
      categoryId: this.categoryId,
      _id: { $ne: this._id }
    });

  if (existingTemplate) {
    throw new Error('Ein Template mit diesem Namen existiert bereits in dieser Kategorie');
  }

  next();
});

// Index für bessere Performance
activityTemplateSchema.index({ categoryId: 1, name: 1 });

// Model nur einmal erstellen
let ActivityTemplate: mongoose.Model<IActivityTemplate>;

try {
  ActivityTemplate = mongoose.model<IActivityTemplate>('ActivityTemplate');
} catch {
  ActivityTemplate = mongoose.model<IActivityTemplate>('ActivityTemplate', activityTemplateSchema);
}

export { ActivityTemplate }; 