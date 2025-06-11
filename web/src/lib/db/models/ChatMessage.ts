import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatMessage extends Document {
  content: string;
  userId: Types.ObjectId;
  userName: string; // Cached for performance
  
  // Chat context - either activity or group
  activityId?: Types.ObjectId; // For activity-specific chats
  groupId?: Types.ObjectId; // For group-level chats
  
  // Message metadata
  messageType: 'text' | 'system'; // For future: images, files, etc.
  isAdminMessage: boolean; // To distinguish admin messages
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000, // Reasonable limit for chat messages
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    activityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    messageType: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
    isAdminMessage: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Validation: Either activityId or groupId must be present, but not both
chatMessageSchema.pre('save', function(next) {
  if (!this.activityId && !this.groupId) {
    return next(new Error('Entweder activityId oder groupId muss angegeben werden.'));
  }
  
  if (this.activityId && this.groupId) {
    return next(new Error('Es kann nicht gleichzeitig activityId und groupId angegeben werden.'));
  }
  
  next();
});

// Indexes for efficient queries
chatMessageSchema.index({ activityId: 1, createdAt: -1 }); // Activity chat messages by time
chatMessageSchema.index({ groupId: 1, createdAt: -1 }); // Group chat messages by time
chatMessageSchema.index({ userId: 1, createdAt: -1 }); // User's messages
chatMessageSchema.index({ createdAt: -1 }); // General time-based queries

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema); 