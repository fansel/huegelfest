import { Schema, model, models, Document, Types } from 'mongoose';
import { IActivityCategory } from './ActivityCategory';
import { IActivityTemplate } from './ActivityTemplate';
import { IGroup } from './Group';
import { IUser } from './User';

export interface IActivity extends Document {
  date: Date;
  startTime: string;
  endTime?: string;
  categoryId: Types.ObjectId | IActivityCategory;
  templateId?: Types.ObjectId | IActivityTemplate;
  customName?: string;
  description?: string;
  groupId?: Types.ObjectId | IGroup;
  responsibleUsers?: (Types.ObjectId | IUser)[];
  createdBy: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}

const ActivitySchema = new Schema<IActivity>({
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: String,
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'ActivityCategory',
    required: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'ActivityTemplate'
  },
  customName: String,
  description: String,
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  responsibleUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessageAt: {
    type: Date
  }
}, {
  timestamps: true
});

const Activity = models.Activity || model<IActivity>('Activity', ActivitySchema);

export default Activity; 