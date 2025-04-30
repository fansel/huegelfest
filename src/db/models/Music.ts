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
  }
}, {
  timestamps: true
});

const Music = mongoose.models.Music || mongoose.model('Music', musicSchema);

export default Music; 