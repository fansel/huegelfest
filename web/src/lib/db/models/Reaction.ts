import mongoose, { Document, Model } from 'mongoose';

export type ReactionType = 'thumbsUp' | 'clap' | 'laugh' | 'surprised' | 'heart';

interface IReactionDocument extends Document {
  announcementId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

reactionSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

reactionSchema.virtual('announcement', {
  ref: 'Announcement',
  localField: 'announcementId',
  foreignField: '_id',
  justOne: true
});

reactionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

const Reaction: Model<IReactionDocument> = mongoose.models.Reaction || mongoose.model<IReactionDocument>('Reaction', reactionSchema);

export default Reaction; 