import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface für Gruppen im Festival-System
 */
export interface IGroup extends Document {
  name: string; // Gruppenname (z.B. "Küche", "Technik", "Orga")
  color: string; // Hex-Farbe für die Gruppe
  isAssignable: boolean; // Kann bei Anmeldung automatisch zugeteilt werden
  maxMembers?: number; // Maximale Anzahl Mitglieder (optional)
  description?: string; // Optionale Beschreibung
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual für Mitgliederanzahl
  memberCount: number;
}

/**
 * Interface für das Group-Model mit statischen Methoden
 */
export interface IGroupModel extends Model<IGroup> {
  getAssignableGroups(): Promise<IGroup[]>;
  getRandomAssignableGroup(): Promise<IGroup | null>;
  getMemberCount(groupId: string): Promise<number>;
}

const GroupSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  color: {
    type: String,
    required: true,
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  isAssignable: {
    type: Boolean,
    default: true
  },
  maxMembers: {
    type: Number,
    min: 1,
    max: 1000
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
GroupSchema.virtual('memberCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'groupId',
  count: true
});

// Statische Methoden
GroupSchema.statics.getAssignableGroups = async function() {
  return this.find({ isAssignable: true }).exec();
};

GroupSchema.statics.getRandomAssignableGroup = async function() {
  const assignableGroups = await this.find({ isAssignable: true }).exec();
  if (assignableGroups.length === 0) return null;
  
  // Berücksichtige maxMembers wenn gesetzt
  const availableGroups = [];
  for (const group of assignableGroups) {
    if (group.maxMembers) {
      const User = mongoose.model('User');
      const memberCount = await User.countDocuments({ groupId: group._id });
      if (memberCount < group.maxMembers) {
        availableGroups.push(group);
      }
    } else {
      availableGroups.push(group);
    }
  }
  
  if (availableGroups.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * availableGroups.length);
  return availableGroups[randomIndex];
};

GroupSchema.statics.getMemberCount = async function(groupId: string) {
  const User = mongoose.model('User');
  return await User.countDocuments({ groupId: new mongoose.Types.ObjectId(groupId) });
};

// Indizes
GroupSchema.index({ name: 1 }, { unique: true });
GroupSchema.index({ isAssignable: 1 });

let Group: IGroupModel;
try {
  Group = mongoose.model<IGroup, IGroupModel>('Group');
} catch {
  Group = mongoose.model<IGroup, IGroupModel>('Group', GroupSchema);
}

export { Group }; 