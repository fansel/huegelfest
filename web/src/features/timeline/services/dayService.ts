import { Day, IDay } from '@/lib/db/models/Day';

export async function createDay(data: { title: string; description?: string; date: Date }) {
  console.log('[createDay] Eingabedaten:', data);
  const day = new Day(data);
  await day.save();
  console.log('[createDay] Gespeichert:', day);
  return day;
}

export async function getDays() {
  const result = await Day.find().sort({ date: 1 }).lean();
  console.log('[getDays] Gefundene Tage:', result);
  return result;
}

export async function updateDay(dayId: string, data: Partial<IDay>) {
  return Day.findByIdAndUpdate(dayId, data, { new: true }).lean();
}

export async function deleteDay(dayId: string) {
  return Day.findByIdAndDelete(dayId);
} 