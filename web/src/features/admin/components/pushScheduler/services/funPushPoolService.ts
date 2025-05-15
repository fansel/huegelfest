import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
import { FunPushPoolConfig } from '../pushSchedulerTypes';
import { connectDB } from '../../../../../lib/db/connector'

const funPushPoolSchema = new Schema<FunPushPoolConfig>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  startDate: { type: String, required: true }, // "YYYY-MM-DD"
  endDate: { type: String, required: true },   // "YYYY-MM-DD"
  repeat: { type: String, enum: ['once', 'daily', 'custom'], required: true },
  weekdays: { type: [Number], required: false },
  from: { type: String, required: true }, // "HH:mm"
  to: { type: String, required: true },   // "HH:mm"
  count: { type: Number, required: true },
  messages: { type: [Object], required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, required: true },
});

const FunPushPool = models.FunPushPool || model<FunPushPoolConfig>('FunPushPool', funPushPoolSchema);

export async function getFunPushPools(): Promise<FunPushPoolConfig[]> {
  await connectDB();
  const pools = await FunPushPool.find().lean();
  return pools.map((pool: any) => ({
    ...pool,
    _id: undefined,
    __v: undefined,
    createdAt: pool.createdAt instanceof Date ? pool.createdAt.toISOString() : pool.createdAt,
    messages: Array.isArray(pool.messages)
      ? pool.messages.map((msg: any) => ({
          ...msg,
          createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
        }))
      : pool.messages,
  }));
}

export async function saveFunPushPool(pool: FunPushPoolConfig): Promise<void> {
  await connectDB();
  // Logging für Debugging
  console.log('[saveFunPushPool] Eingehender Pool:', pool);
  const safePool = {
    id: pool.id,
    name: pool.name,
    startDate: pool.startDate,
    endDate: pool.endDate,
    repeat: pool.repeat,
    weekdays: pool.weekdays,
    from: pool.from,
    to: pool.to,
    count: pool.count,
    messages: Array.isArray(pool.messages)
      ? pool.messages.map((m: any) => ({
          ...m,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        }))
      : pool.messages,
    createdBy: pool.createdBy,
    createdAt: new Date(pool.createdAt),
  };
  try {
    const result = await FunPushPool.findOneAndUpdate(
      { id: pool.id },
      { $set: safePool },
      { upsert: true, new: true }
    );
    console.log('[saveFunPushPool] Ergebnis:', result);
  } catch (err) {
    console.error('[saveFunPushPool] Fehler:', err);
    throw err;
  }
}

export async function deleteFunPushPool(id: string): Promise<void> {
  await connectDB();
  await FunPushPool.deleteOne({ id });
} 