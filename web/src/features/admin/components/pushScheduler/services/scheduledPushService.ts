import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
import { ScheduledPushMessage } from '../pushSchedulerTypes';
import { connectDB } from '../../../../../lib/db/connector';

const scheduledPushSchema = new Schema<ScheduledPushMessage>({
  id: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  sendTimes: { type: [Object], required: true },
  repeat: { type: Object, required: false },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, required: true },
});

const ScheduledPush = models.ScheduledPush || model<ScheduledPushMessage>('ScheduledPush', scheduledPushSchema);

export async function getScheduledPushMessages(): Promise<ScheduledPushMessage[]> {
  await connectDB();
  return (await ScheduledPush.find().lean()) as unknown as ScheduledPushMessage[];
}

export async function saveScheduledPushMessage(msg: ScheduledPushMessage): Promise<void> {
  await connectDB();
  await ScheduledPush.findOneAndUpdate(
    { id: msg.id },
    { $set: msg },
    { upsert: true, new: true }
  );
}

export async function deleteScheduledPushMessage(id: string): Promise<void> {
  await connectDB();
  await ScheduledPush.deleteOne({ id });
} 