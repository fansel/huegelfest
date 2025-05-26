import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivity extends Document {
  date: Date;
  time?: string;
  categoryId: Types.ObjectId;
  templateId?: Types.ObjectId;
  customName?: string;
  description: string;
  groupId?: Types.ObjectId;
  responsibleUsers?: Types.ObjectId[]; // Hauptverantwortliche Benutzer
  createdBy: string; // Admin device ID
  agendaJobId?: string; // For push reminders
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          // Validate time format: "08:00", "08:00-10:00", etc.
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](-([0-1]?[0-9]|2[0-3]):[0-5][0-9])?$/.test(v);
        },
        message: 'Zeit muss im Format HH:MM oder HH:MM-HH:MM sein (z.B. "08:00" oder "08:00-10:00").'
      }
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ActivityCategory',
      required: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'ActivityTemplate',
    },
    customName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    responsibleUsers: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
    },
    createdBy: {
      type: String,
      required: true,
    },
    agendaJobId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Validation: Either templateId OR customName must be provided
activitySchema.pre('save', function(next) {
  if (!this.templateId && !this.customName) {
    return next(new Error('Entweder ein Template oder ein eigener Name muss angegeben werden.'));
  }
  
  if (this.templateId && this.customName) {
    return next(new Error('Es kann nicht gleichzeitig ein Template und ein eigener Name angegeben werden.'));
  }
  
  next();
});

// Indexes für bessere Performance
activitySchema.index({ date: 1 });
activitySchema.index({ groupId: 1, date: 1 });
activitySchema.index({ categoryId: 1 });
activitySchema.index({ createdBy: 1 });

// Model nur einmal erstellen
let Activity: mongoose.Model<IActivity>;

try {
  Activity = mongoose.model<IActivity>('Activity');
} catch {
  Activity = mongoose.model<IActivity>('Activity', activitySchema);
}

export { Activity }; 