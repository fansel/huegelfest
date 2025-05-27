import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Magic Code für Gerätewechsel und Nachmeldungen
 * - Device Transfer: Kurzlebig (5 Minuten)
 * - Nachmeldung: Langlebig (unbegrenzt)
 * - Nur einmal verwendbar
 * - Verknüpft mit User deviceId
 */
export interface IMagicCode extends Document {
  code: string; // 6-stelliger Code
  deviceId: string; // Original Device ID
  userId: mongoose.Types.ObjectId; // User Reference
  expiresAt: Date; // Ablaufzeit
  isUsed: boolean; // Bereits verwendet
  createdBy: 'user' | 'admin' | 'nachmeldung'; // Wer hat den Code erstellt
  codeType: 'device-transfer' | 'nachmeldung'; // Typ des Codes
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
  createForNachmeldung(deviceId: string): Promise<IMagicCode>;
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
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: String,
    enum: ['user', 'admin', 'nachmeldung'],
    required: true
  },
  codeType: {
    type: String,
    enum: ['device-transfer', 'nachmeldung'],
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

// Explizite Indizes für bessere Performance
MagicCodeSchema.index({ deviceId: 1 });
MagicCodeSchema.index({ userId: 1 });

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
    code = Math.floor(100000 + Math.random() * 900000).toString();
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
    codeType: 'device-transfer',
    adminId
  });

  await magicCode.save();
  return magicCode;
};

MagicCodeSchema.statics.createForNachmeldung = async function(deviceId: string): Promise<IMagicCode> {
  // Finde User
  const { User } = await import('./User');
  const user = await User.findByDeviceId(deviceId);
  
  if (!user) {
    throw new Error('User nicht gefunden');
  }

  // Lösche alte Nachmeldung-Codes für diesen User
  await this.deleteMany({ userId: user._id, codeType: 'nachmeldung' });

  // Generiere neuen eindeutigen Code
  let code: string;
  let attempts = 0;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await this.findOne({ code });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new Error('Konnte keinen eindeutigen Code generieren');
  }

  // Erstelle Magic Code - 1 Jahr gültig für Nachmeldungen
  const magicCode = new this({
    code,
    deviceId,
    userId: user._id,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Jahr
    createdBy: 'nachmeldung',
    codeType: 'nachmeldung'
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