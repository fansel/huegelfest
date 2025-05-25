import mongoose from 'mongoose';
import { hash } from 'bcryptjs';

export interface ISystemUser {
  systemUsername: string;
  password: string;
  role: 'admin' | 'systemUser';
  lastLogin?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  email?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isLocked(): boolean;
  resetFailedLoginAttempts(): Promise<ISystemUser>;
  incrementFailedLoginAttempts(): Promise<ISystemUser>;
  save(): Promise<ISystemUser>;
}

const systemUserSchema = new mongoose.Schema<ISystemUser>({
  systemUsername: {
    type: String,
    required: [true, 'Benutzername ist erforderlich'],
    unique: true,
    trim: true,
    minlength: [3, 'Benutzername muss mindestens 3 Zeichen lang sein'],
    maxlength: [30, 'Benutzername darf maximal 30 Zeichen lang sein']
  },
  password: {
    type: String,
    required: [true, 'Passwort ist erforderlich'],
    minlength: [8, 'Passwort muss mindestens 8 Zeichen lang sein']
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'systemUser'],
      message: '{VALUE} ist keine gültige Rolle'
    },
    default: 'systemUser'
  },
  lastLogin: {
    type: Date
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Bitte geben Sie eine gültige E-Mail-Adresse ein']
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      return ret;
    }
  }
});

systemUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await hash(this.password, 12);
    next();
  } catch (error) {
    next(error as Error);
  }
});

systemUserSchema.methods.resetFailedLoginAttempts = function() {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  return this.save();
};

systemUserSchema.methods.incrementFailedLoginAttempts = function() {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  return this.save();
};

systemUserSchema.methods.isLocked = function() {
  return this.lockedUntil && this.lockedUntil > new Date();
};

let SystemUser: mongoose.Model<ISystemUser>;
try {
  SystemUser = mongoose.model<ISystemUser>('SystemUser');
} catch {
  SystemUser = mongoose.model<ISystemUser>('SystemUser', systemUserSchema);
}

export { SystemUser }; 