import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPacklistItem {
  text: string;
  checked: boolean;
}

export interface IPacklist extends Document {
  key: string; // z.B. "global"
  items: IPacklistItem[];
  updatedAt: Date;
  createdAt: Date;
}

const PacklistItemSchema = new Schema<IPacklistItem>({
  text: { type: String, required: true },
  checked: { type: Boolean, default: false },
}, { _id: false });

const PacklistSchema = new Schema<IPacklist>({
  key: { type: String, required: true, unique: true, index: true },
  items: { type: [PacklistItemSchema], default: [] },
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

const Packlist: Model<IPacklist> = mongoose.models.Packlist || mongoose.model<IPacklist>('Packlist', PacklistSchema);

export default Packlist; 