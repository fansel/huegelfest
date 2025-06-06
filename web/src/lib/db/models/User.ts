import mongoose, { Schema, Document, Model } from 'mongoose';
import { hash, compare } from 'bcryptjs';
import crypto from 'crypto';

/**
 * Vereinheitlichtes User-Model für das Festival
 * Ersetzt sowohl das alte Device-basierte System als auch SystemUser
 * Alle User authentifizieren sich über E-Mail/Passwort
 */
export interface IUser extends Document {
  name: string; // Name des Benutzers
  email?: string; // E-Mail für Passwort-Reset (optional)
  password: string; // Passwort für Authentifizierung (erforderlich)
  username: string; // Username für Authentifizierung (erforderlich)
  role: 'user' | 'admin'; // Rolle des Users
  
  // Festival-spezifische Felder
  groupId?: mongoose.Types.ObjectId; // Zugewiesene Gruppe
  registrationId?: mongoose.Types.ObjectId; // Verknüpfte Registrierung
  isActive: boolean; // Ob User aktiv ist
  isShadowUser: boolean; // Shadow User (erscheint nicht in Listen)
  
  // Auth-spezifische Felder
  emailVerified: boolean; // Ob E-Mail verifiziert ist
  lastLogin?: Date; // Letzter Login
  failedLoginAttempts: number; // Anzahl fehlgeschlagener Login-Versuche
  lockedUntil?: Date; // Account-Sperre bis
  
  // Password Reset Felder
  passwordResetToken?: string; // Token für Passwort-Reset
  passwordResetExpires?: Date; // Ablaufzeit des Reset-Tokens
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methoden
  assignToGroup(groupId: mongoose.Types.ObjectId): Promise<IUser>;
  validatePassword(password: string): Promise<boolean>;
  isLocked(): boolean;
  resetFailedLoginAttempts(): Promise<IUser>;
  incrementFailedLoginAttempts(): Promise<IUser>;
  
  // Password Reset Methoden
  createPasswordResetToken(): string;
  clearPasswordResetToken(): Promise<IUser>;
}

/**
 * Interface für statische Methoden
 */
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  findByEmailOrUsername(identifier: string): Promise<IUser | null>;
  findByPasswordResetToken(token: string): Promise<IUser | null>;
  createUser(name: string, username: string, password: string, role?: 'user' | 'admin', email?: string): Promise<IUser>;
}

const UserSchema = new Schema<IUser>({
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: [2, 'Name muss mindestens 2 Zeichen lang sein'],
    maxlength: [50, 'Name darf maximal 50 Zeichen lang sein']
  },
  
  // Auth-Felder (jetzt erforderlich)
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,  // Erlaubt mehrere Dokumente ohne E-Mail
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Bitte geben Sie eine gültige E-Mail-Adresse ein']
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Passwort muss mindestens 8 Zeichen lang sein']
  },
  username: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
    trim: true,
    minlength: [3, 'Username muss mindestens 3 Zeichen lang sein'],
    maxlength: [30, 'Username darf maximal 30 Zeichen lang sein']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    required: true
  },
  
  // Festival-spezifische Felder
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
  },
  isShadowUser: {
    type: Boolean,
    default: false
  },
  
  // Auth-spezifische Felder
  emailVerified: {
    type: Boolean,
    default: true
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
  
  // Password Reset Felder
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Passwort nie in JSON ausgeben
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

// Pre-save Hook für Passwort-Hashing
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await hash(this.password, 12);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Statische Methoden
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true, isShadowUser: { $ne: true } });
};

UserSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ username, isActive: true, isShadowUser: { $ne: true } });
};

UserSchema.statics.findByEmailOrUsername = function(identifier: string) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ],
    isActive: true
    // Shadow users können sich einloggen, aber erscheinen nicht in Listen
  });
};

UserSchema.statics.createUser = async function(
  name: string, 
  username: string, 
  password: string, 
  role: 'user' | 'admin' = 'user',
  email?: string
) {
  return this.create({
    name,
    email: email?.toLowerCase(),
    password,
    username,
    role,
    isActive: true,
    emailVerified: true
  });
};

// Instance-Methoden
UserSchema.methods.assignToGroup = function(groupId: mongoose.Types.ObjectId) {
  this.groupId = groupId;
  return this.save();
};

UserSchema.methods.validatePassword = async function(password: string): Promise<boolean> {
  if (!this.password) return false;
  return compare(password, this.password);
};

UserSchema.methods.isLocked = function(): boolean {
  return this.lockedUntil && this.lockedUntil > new Date();
};

UserSchema.methods.resetFailedLoginAttempts = function() {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  return this.save();
};

UserSchema.methods.incrementFailedLoginAttempts = function() {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 Minuten Sperre
  }
  return this.save();
};

// Password Reset Methoden
UserSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 Minuten gültig
  
  return resetToken; // Ungehashter Token für E-Mail
};

UserSchema.methods.clearPasswordResetToken = function() {
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
  return this.save();
};

UserSchema.statics.findByPasswordResetToken = function(token: string) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
    
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
    isActive: true
  });
};

let User: IUserModel;
try {
  User = mongoose.model<IUser, IUserModel>('User');
} catch {
  User = mongoose.model<IUser, IUserModel>('User', UserSchema);
}

export { User }; 