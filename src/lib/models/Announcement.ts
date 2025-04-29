import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  content: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  author: { type: String, required: true },
  group: { type: String, required: true },
  important: { type: Boolean, default: false },
  reactions: {
    thumbsUp: {
      count: { type: Number, default: 0 },
      deviceReactions: { type: Map, of: Object, default: new Map() }
    },
    clap: {
      count: { type: Number, default: 0 },
      deviceReactions: { type: Map, of: Object, default: new Map() }
    },
    laugh: {
      count: { type: Number, default: 0 },
      deviceReactions: { type: Map, of: Object, default: new Map() }
    },
    surprised: {
      count: { type: Number, default: 0 },
      deviceReactions: { type: Map, of: Object, default: new Map() }
    },
    heart: {
      count: { type: Number, default: 0 },
      deviceReactions: { type: Map, of: Object, default: new Map() }
    }
  }
}, { timestamps: true });

export const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema); 