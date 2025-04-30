import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  color: {
    type: String,
    required: true
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

const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);

export default Group; 