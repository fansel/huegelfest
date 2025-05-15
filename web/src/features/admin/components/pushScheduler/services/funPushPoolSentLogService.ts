import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;

const sentLogSchema = new Schema({
  poolId: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:mm
  messageId: { type: String, required: true },
});

const FunPushPoolSentLog = models.FunPushPoolSentLog || model('FunPushPoolSentLog', sentLogSchema);

export async function wasSent(poolId: string, date: string, time: string, messageId: string): Promise<boolean> {
  return !!(await FunPushPoolSentLog.findOne({ poolId, date, time, messageId }));
}

export async function logSent(poolId: string, date: string, time: string, messageId: string): Promise<void> {
  await FunPushPoolSentLog.create({ poolId, date, time, messageId });
} 