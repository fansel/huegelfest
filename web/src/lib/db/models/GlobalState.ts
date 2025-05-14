import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalState extends Document {
  signupOpen: boolean;
}

const GlobalStateSchema = new Schema<IGlobalState>({
  signupOpen: { type: Boolean, required: true, default: false },
});

export default mongoose.models.GlobalState ||
  mongoose.model<IGlobalState>('GlobalState', GlobalStateSchema); 