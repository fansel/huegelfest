import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Magic Code für Gerätewechsel
 * - Kurzlebig (5 Minuten)
 * - Nur einmal verwendbar
 * - Verknüpft mit User deviceId
 */
export interface IMagicCode extends Document {
  code: string; // 6-stelliger Code
  deviceId: string; // Original Device ID
  userId: mongoose.Types.ObjectId; // User Reference
  expiresAt: Date; // Ablaufzeit
  isUsed: boolean; // Bereits verwendet
  createdBy: 'user' | 'admin'; // Wer hat den Code erstellt
  adminId?: string; // Bei Admin-Erstellung: Admin Username
  createdAt: Date;
  
  // Methoden
  isExpired(): boolean;
  isValid(): boolean;
}

/**
 * Interface für statische Methoden
 */
export interface IMagicCodeModel extends Model<IMagicCode> {
  generateCode(): string;
  createForUser(deviceId: string, createdBy: 'user' | 'admin', adminId?: string): Promise<IMagicCode>;
  verifyCode(code: string): Promise<IMagicCode | null>;
  cleanupExpired(): Promise<number>;
}

const MagicCodeSchema = new Schema<IMagicCode>({
  code: {
    type: String,
    required: true,
    unique: true,
    length: 6,
    match: [/^\d{6}$/, 'Code muss 6 Ziffern enthalten']
  },
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  adminId: {
    type: String,
    required: false
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

// TTL Index - automatisches Löschen nach Ablauf
MagicCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance-Methoden
MagicCodeSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt;
};

MagicCodeSchema.methods.isValid = function(): boolean {
  return !this.isUsed && !this.isExpired();
};

// Statische Methoden
MagicCodeSchema.statics.generateCode = function(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

MagicCodeSchema.statics.createForUser = async function(
  deviceId: string, 
  createdBy: 'user' | 'admin', 
  adminId?: string
): Promise<IMagicCode> {
  // Finde User
  const { User } = await import('./User');
  const user = await User.findByDeviceId(deviceId);
  
  if (!user) {
    throw new Error('User nicht gefunden');
  }

  // Lösche alte Codes für diesen User
  await this.deleteMany({ userId: user._id });

  // Generiere neuen eindeutigen Code
  let code: string;
  let attempts = 0;
  do {
    code = this.generateCode();
    const existing = await this.findOne({ code });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new Error('Konnte keinen eindeutigen Code generieren');
  }

  // Erstelle Magic Code
  const magicCode = new this({
    code,
    deviceId,
    userId: user._id,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 Minuten
    createdBy,
    adminId
  });

  await magicCode.save();
  return magicCode;
};

MagicCodeSchema.statics.verifyCode = async function(code: string): Promise<IMagicCode | null> {
  const magicCode = await this.findOne({ 
    code, 
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).populate('userId');

  return magicCode;
};

MagicCodeSchema.statics.cleanupExpired = async function(): Promise<number> {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true }
    ]
  });
  return result.deletedCount;
};

let MagicCode: IMagicCodeModel;
try {
  MagicCode = mongoose.model<IMagicCode, IMagicCodeModel>('MagicCode');
} catch {
  MagicCode = mongoose.model<IMagicCode, IMagicCodeModel>('MagicCode', MagicCodeSchema);
}

export { MagicCode }; 