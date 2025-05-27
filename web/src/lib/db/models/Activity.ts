import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivity extends Document {
  date: Date;
  startTime: string; // HH:MM format (e.g., "08:00") - required
  endTime?: string; // HH:MM format (e.g., "10:00") - optional
  categoryId: Types.ObjectId;
  templateId?: Types.ObjectId;
  customName?: string;
  description?: string; // Optional description
  groupId?: Types.ObjectId;
  responsibleUsers?: Types.ObjectId[]; // Hauptverantwortliche Benutzer
  createdBy: string; // Admin device ID
  agendaJobId?: string; // For push reminders
  responsiblePushJobId?: string; // For responsible users push reminders
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          // Validate time format: "08:00"
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Startzeit muss im Format HH:MM sein (z.B. "08:00").'
      }
    },
    endTime: {
      type: String,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          // Validate time format: "08:00"
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Endzeit muss im Format HH:MM sein (z.B. "10:00").'
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
      required: false,
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
    responsiblePushJobId: {
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

  // Validate that endTime is after startTime if both are provided
  if (this.startTime && this.endTime) {
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      return next(new Error('Endzeit muss nach der Startzeit liegen.'));
    }
  }
  
  next();
});

// Index for efficient queries
activitySchema.index({ date: 1, startTime: 1 });
activitySchema.index({ groupId: 1, date: 1 });
activitySchema.index({ responsibleUsers: 1 });

export const Activity = mongoose.models.Activity || mongoose.model<IActivity>('Activity', activitySchema); 