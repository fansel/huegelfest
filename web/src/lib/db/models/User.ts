import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Vereinfachtes User-Model für das Festival
 * Nur die wirklich benötigten Felder
 */
export interface IUser extends Document {
  name: string; // Name des Benutzers
  deviceId: string; // Eindeutige Device-ID
  groupId?: mongoose.Types.ObjectId; // Zugewiesene Gruppe
  registrationId?: mongoose.Types.ObjectId; // Verknüpfte Registrierung
  isActive: boolean; // Ob User aktiv ist
  createdAt: Date;
  updatedAt: Date;
  
  // Vereinfachte Methoden
  assignToGroup(groupId: mongoose.Types.ObjectId): Promise<IUser>;
}

/**
 * Interface für statische Methoden
 */
export interface IUserModel extends Model<IUser> {
  findByDeviceId(deviceId: string): Promise<IUser | null>;
}

const UserSchema = new Schema<IUser>({
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: [2, 'Name muss mindestens 2 Zeichen lang sein'],
    maxlength: [50, 'Name darf maximal 50 Zeichen lang sein']
  },
  deviceId: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false
  },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: false
  },
  isActive: { 
    type: Boolean, 
    default: true 
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

// Virtuelle Felder für Relationen
UserSchema.virtual('registration', {
  ref: 'Registration',
  localField: 'registrationId',
  foreignField: '_id',
  justOne: true
});

UserSchema.virtual('group', {
  ref: 'Group',
  localField: 'groupId',
  foreignField: '_id',
  justOne: true
});

// Statische Methoden
UserSchema.statics.findByDeviceId = function(deviceId: string) {
  return this.findOne({ deviceId, isActive: true });
};

// Instance-Methoden
UserSchema.methods.assignToGroup = function(groupId: mongoose.Types.ObjectId) {
  this.groupId = groupId;
  return this.save();
};

let User: IUserModel;
try {
  User = mongoose.model<IUser, IUserModel>('User');
} catch {
  User = mongoose.model<IUser, IUserModel>('User', UserSchema);
}

export { User }; 