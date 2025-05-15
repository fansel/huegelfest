import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;

const sentLogSchema = new Schema({
  msgId: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:mm
  messageId: { type: String, required: true },
});

const ScheduledPushSentLog = models.ScheduledPushSentLog || model('ScheduledPushSentLog', sentLogSchema);

export async function wasSent(msgId: string, date: string, time: string, messageId: string): Promise<boolean> {
  return !!(await ScheduledPushSentLog.findOne({ msgId, date, time, messageId }));
}

export async function logSent(msgId: string, date: string, time: string, messageId: string): Promise<void> {
  await ScheduledPushSentLog.create({ msgId, date, time, messageId });
} 