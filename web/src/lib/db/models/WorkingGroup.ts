import mongoose, { Document, Model } from 'mongoose';

interface IWorkingGroupDocument extends Document {
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const workingGroupSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  color: { 
    type: String, 
    required: true,
    default: '#ff9900',
    validate: {
      validator: function(v: string) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: props => `${props.value} ist keine gültige Hex-Farbkodierung!`
    }
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Virtuelle Felder für Ankündigungen
workingGroupSchema.virtual('announcements', {
  ref: 'Announcement',
  localField: '_id',
  foreignField: 'workingGroupId'
});

// Middleware für Validierung
workingGroupSchema.pre('save', async function(next) {
  try {
    // Prüfe auf Duplikate
    const existingWorkingGroup = await this.constructor.findOne({ 
      name: this.name,
      _id: { $ne: this._id }
    });
    
    if (existingWorkingGroup) {
      throw new Error(`Eine Gruppe mit dem Namen "${this.name}" existiert bereits`);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

let WorkingGroup: Model<IWorkingGroupDocument>;
try {
  WorkingGroup = mongoose.model<IWorkingGroupDocument>('WorkingGroup');
} catch {
  WorkingGroup = mongoose.model<IWorkingGroupDocument>('WorkingGroup', workingGroupSchema);
}

export { WorkingGroup }; 