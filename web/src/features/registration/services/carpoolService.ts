import { Ride } from '@/lib/db/models/Ride';

export interface RidePassenger {
  name: string;
  contact?: string;
}

export interface RideData {
  driver: string;
  direction: 'hinfahrt' | 'rückfahrt';
  start: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  contact: string;
  passengers: RidePassenger[];
}

function mapRideDoc(doc: any): RideData & { _id: string; createdAt: string; updatedAt: string } {
  return {
    ...doc,
    _id: doc._id?.toString?.() ?? '',
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
    passengers: Array.isArray(doc.passengers)
      ? doc.passengers.map((p: any) => ({ name: p.name, contact: p.contact }))
      : [],
  };
}

export async function createRide(data: RideData) {
  const ride = new Ride(data);
  await ride.save();
  return mapRideDoc(ride.toObject());
}

export async function getRides() {
  const docs = await Ride.find().sort({ date: 1, time: 1 }).lean().exec();
  return Array.isArray(docs) ? docs.map(mapRideDoc) : [];
}

export async function updateRide(_id: string, updates: Partial<RideData>) {
  const doc = await Ride.findByIdAndUpdate(_id, updates, { new: true }).lean().exec();
  if (!doc) return null;
  return mapRideDoc(doc);
}

export async function deleteRide(_id: string) {
  const res = await Ride.findByIdAndDelete(_id);
  return !!res;
} 