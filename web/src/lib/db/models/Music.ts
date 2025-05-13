import mongoose, { Document, Schema } from 'mongoose';

export interface TrackInfo {
  title: string;
  author_name: string;
  thumbnail_url: string;
  author_url: string;
  description: string;
  html: string;
}

export interface MusicDocument extends Document {
  url: string;
  trackInfo: TrackInfo;
  audioData?: Buffer;
  mimeType?: string;
  coverArtData?: Buffer;
  coverArtMimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TrackInfoSchema = new Schema<TrackInfo>({
  title: { type: String, required: true },
  author_name: { type: String, required: true },
  thumbnail_url: { type: String },
  author_url: { type: String },
  description: { type: String },
  html: { type: String },
}, { _id: false });

const MusicSchema = new Schema<MusicDocument>({
  url: { type: String, required: true, unique: true },
  trackInfo: { type: TrackInfoSchema, required: true },
  mimeType: { type: String },
  coverArtData: { type: Buffer },
  coverArtMimeType: { type: String },
  audioData: { type: Buffer },
}, { timestamps: true });

export default mongoose.models.Music || mongoose.model<MusicDocument>('Music', MusicSchema); 