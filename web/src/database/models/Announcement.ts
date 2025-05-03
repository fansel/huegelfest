import mongoose from 'mongoose';
import Group from './Group';

const announcementSchema = new mongoose.Schema({
  content: { type: String, required: true },
  date: { type: String },
  time: { type: String },
  groupId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  important: { type: Boolean, default: false },
  reactions: {
    thumbsUp: {
      count: { type: Number, default: 0 },
      deviceReactions: { type: Object, default: {} }
    },
    clap: {
      count: { type: Number, default: 0 },
      deviceReactions: { type: Object, default: {} }
    },
    laugh: {
      count: { type: Number, default: 0 },
      deviceReactions: { type: Object, default: {} }
    },
    surprised: {
      count: { type: Number, default: 0 },
      deviceReactions: { type: Object, default: {} }
    },
    heart: {
      count: { type: Number, default: 0 },
      deviceReactions: { type: Object, default: {} }
    }
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);

export default Announcement; 