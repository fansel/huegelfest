import mongoose, { Document, Model } from 'mongoose';
import Group from './Group';

interface IAnnouncementDocument extends Document {
  content: string;
  date?: string;
  time?: string;
  groupId: mongoose.Types.ObjectId;
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
    ref: 'Group',
    required: true,
    index: true
  },
  important: { type: Boolean, default: false }
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
  ref: 'Group',
  localField: 'groupId',
  foreignField: '_id',
  justOne: true
});

// Virtuelle Felder für Reactions
announcementSchema.virtual('reactions', {
  ref: 'Reaction',
  localField: '_id',
  foreignField: 'announcementId'
});

// Middleware für Validierung
announcementSchema.pre('save', async function(next) {
  try {
    const group = await Group.findById(this.groupId);
    if (!group) {
      throw new Error(`Gruppe mit ID ${this.groupId} nicht gefunden`);
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Announcement: Model<IAnnouncementDocument> = mongoose.models.Announcement || mongoose.model<IAnnouncementDocument>('Announcement', announcementSchema);

export default Announcement; 