import mongoose from 'mongoose';

const musicSchema = new mongoose.Schema({
    url: {
      type: String,
      required: true,
    unique: true
    },
    trackInfo: {
    title: String,
    author_name: String,
    thumbnail_url: String,
    author_url: String,
    description: String,
    html: String
    },
    audioData: {
      type: Buffer,
    required: true
    },
    mimeType: {
      type: String,
      required: true,
    default: 'audio/mpeg'
    },
    soundcloudResponse: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

const Music = mongoose.models.Music || mongoose.model('Music', musicSchema);

export type MusicDocument = mongoose.Document & {
  url: string;
  trackInfo: {
    title: string;
    author_name: string;
    thumbnail_url: string;
    author_url: string;
    description: string;
    html: string;
  };
  audioData: Buffer;
  mimeType: string;
  soundcloudResponse: any;
  createdAt: Date;
  updatedAt: Date;
};

export default Music;
