import { connectDB } from '@/database/config/apiConnector';
import { Ride } from '@/lib/db/models/Ride';

export async function getRides() {
  await connectDB();
  const rides = await Ride.find().sort({ createdAt: -1 });
  return Array.isArray(rides) ? rides : [];
}

export async function createRide(data: any) {
  const requiredFields = ['driver', 'start', 'destination', 'date', 'time', 'seats', 'contact'];
  const missingFields = requiredFields.filter(field => !data[field]);
  if (missingFields.length > 0) {
    throw new Error('Fehlende Pflichtfelder: ' + missingFields.join(', '));
  }
  await connectDB();
  const ride = new Ride(data);
  await ride.save();
  return ride;
}

export async function updateRide(_id: string, data: any) {
  if (!_id) {
    throw new Error('Keine Fahrt-ID angegeben');
  }
  await connectDB();
  const ride = await Ride.findByIdAndUpdate(_id, data, { new: true });
  if (!ride) {
    throw new Error('Fahrt nicht gefunden');
  }
  return ride;
}

export async function deleteRide(id: string) {
  if (!id) {
    throw new Error('Keine Fahrt-ID angegeben');
  }
  await connectDB();
  const ride = await Ride.findByIdAndDelete(id);
  if (!ride) {
    throw new Error('Fahrt nicht gefunden');
  }
  return { success: true };
} 