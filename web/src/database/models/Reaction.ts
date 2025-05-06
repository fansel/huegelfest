import mongoose, { Document, Model } from 'mongoose';

export type ReactionType = 'thumbsUp' | 'clap' | 'laugh' | 'surprised' | 'heart';

interface IReactionDocument extends Document {
  announcementId: mongoose.Types.ObjectId;
  deviceId: string;
  type: ReactionType;
  createdAt: Date;
  updatedAt: Date;
}

const reactionSchema = new mongoose.Schema({
  announcementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Announcement',
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['thumbsUp', 'clap', 'laugh', 'surprised', 'heart'],
    required: true
  }
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

// Compound Index für unique Reactions pro Device
reactionSchema.index({ announcementId: 1, deviceId: 1, type: 1 }, { unique: true });

// Virtuelle Felder für die Ankündigung
reactionSchema.virtual('announcement', {
  ref: 'Announcement',
  localField: 'announcementId',
  foreignField: '_id',
  justOne: true
});

const Reaction: Model<IReactionDocument> = mongoose.models.Reaction || mongoose.model<IReactionDocument>('Reaction', reactionSchema);

export default Reaction; 