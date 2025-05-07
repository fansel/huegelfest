import mongoose, { Document, Model } from 'mongoose';
import Group from './Group';
import { ReactionType } from '@/types/types';

interface IDeviceReaction {
  type: ReactionType;
  announcementId: string;
}

interface IAnnouncementDocument extends Document {
  content: string;
  date?: string;
  time?: string;
  groupId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  important: boolean;
  createdAt: Date;
  updatedAt: Date;
  reactions: Record<ReactionType, {
    count: number;
    deviceReactions: Record<string, IDeviceReaction>;
  }>;
}

const createDefaultReactions = () => {
  const reactions: Record<ReactionType, {
    count: number;
    deviceReactions: Record<string, IDeviceReaction>;
  }> = {} as any;
  
  ['thumbsUp', 'clap', 'laugh', 'surprised', 'heart'].forEach(type => {
    reactions[type as ReactionType] = {
      count: 0,
      deviceReactions: {}
    };
  });
  return reactions;
};

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
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  important: { type: Boolean, default: false },
  reactions: {
    type: Object,
    of: {
      count: { type: Number, default: 0 },
      deviceReactions: {
        type: Object,
        of: {
          type: { type: String, enum: ['thumbsUp', 'clap', 'laugh', 'surprised', 'heart'] },
          announcementId: String
        }
      }
    },
    default: createDefaultReactions
  }
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