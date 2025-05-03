import mongoose from 'mongoose';

export interface IUser {
  username: string;
  password: string;
  isAdmin: boolean;
}

const userSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Stelle sicher, dass das Modell nur einmal erstellt wird
let User: mongoose.Model<IUser>;

try {
  // Versuche das existierende Model zu laden
  User = mongoose.model<IUser>('User');
} catch {
  // Wenn das Model noch nicht existiert, erstelle es
  User = mongoose.model<IUser>('User', userSchema);
}

export { User }; 