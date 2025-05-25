import mongoose, { Document, Model } from 'mongoose';
import { WorkingGroup } from './WorkingGroup';
import { ReactionType } from '@/shared/types/types';
import type { CallbackError } from 'mongoose';

interface IAnnouncementDocument extends Document {
  content: string;
  date?: string;
  time?: string;
  groupId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  important: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new mongoose.Schema({
  content: { type: String, required: true },
  date: { type: String },
  time: { type: String },
  groupId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkingGroup',
    required: true,
    index: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  important: { type: Boolean, default: false },
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Virtuelle Felder für Gruppen-Informationen
announcementSchema.virtual('group', {
  ref: 'WorkingGroup',
  localField: 'groupId',
  foreignField: '_id',
  justOne: true
});

// Virtuelle Felder für den Autor
announcementSchema.virtual('author', {
  ref: 'User',
  localField: 'authorId',
  foreignField: '_id',
  justOne: true
});

// Middleware für Validierung
announcementSchema.pre('save', async function(next) {
  try {
    const group = await WorkingGroup.findById(this.groupId);
    if (!group) {
      throw new Error(`Gruppe mit ID ${this.groupId} nicht gefunden`);
    }
    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

const Announcement: Model<IAnnouncementDocument> = mongoose.models.Announcement || mongoose.model<IAnnouncementDocument>('Announcement', announcementSchema);

export default Announcement; 