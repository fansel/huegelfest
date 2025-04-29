import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Ride } from '@/lib/models/Ride';

export async function GET() {
  try {
    await connectDB();
    const rides = await Ride.find().sort({ createdAt: -1 });
    return NextResponse.json(rides);
  } catch (error) {
    console.error('Fehler beim Laden der Fahrten:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await connectDB();
    
    const ride = new Ride(data);
    await ride.save();
    
    return NextResponse.json(ride);
  } catch (error) {
    console.error('Fehler beim Speichern der Fahrt:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 