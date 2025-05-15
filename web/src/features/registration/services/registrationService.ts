import { Registration } from '@/lib/db/models/Registration';
import { FestivalRegisterData } from '../FestivalRegisterForm';

export async function createRegistration(data: FestivalRegisterData) {
  const reg = new Registration(data);
  await reg.save();
  return reg;
}

export async function getRegistrations() {
  const docs = await Registration.find().sort({ createdAt: -1 }).lean().exec();
  return docs.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  }));
}

export async function updateRegistrationStatus(id: string, updates: { paid?: boolean; checkedIn?: boolean }) {
  const doc = await Registration.findByIdAndUpdate(id, updates, { new: true }).lean().exec();
  if (!doc) return null;
  return {
    ...doc,
    _id: doc._id.toString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  };
}

export async function deleteRegistration(id: string): Promise<boolean> {
  const res = await Registration.findByIdAndDelete(id);
  return !!res;
} 