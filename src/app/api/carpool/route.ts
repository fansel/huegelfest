import { NextResponse } from 'next/server';
import { connectDB } from '@/database/config/connector';
import { Ride } from '@/database/models/Ride';
import { ValidationError } from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    const rides = await Ride.find().sort({ createdAt: -1 });
    
    // Stelle sicher, dass rides ein Array ist
    if (!rides || !Array.isArray(rides)) {
      console.error('Keine gültigen Fahrten gefunden');
      return NextResponse.json({ rides: [] });
    }
    
    return NextResponse.json({ rides });
  } catch (error) {
    console.error('Fehler beim Laden der Fahrten:', error);
    return NextResponse.json({ rides: [], error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validiere erforderliche Felder
    const requiredFields = ['driver', 'start', 'destination', 'date', 'time', 'seats', 'contact'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: 'Fehlende Pflichtfelder', 
        missingFields 
      }, { status: 400 });
    }
    
    await connectDB();
    const ride = new Ride(data);
    await ride.save();
    
    return NextResponse.json({ ride });
  } catch (error) {
    console.error('Fehler beim Speichern der Fahrt:', error);
    
    // Prüfe ob es ein Validierungsfehler ist
    if (error instanceof ValidationError) {
      return NextResponse.json({ 
        error: 'Validierungsfehler',
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { _id } = data;
    
    if (!_id) {
      return NextResponse.json({ 
        error: 'Keine Fahrt-ID angegeben'
      }, { status: 400 });
    }
    
    await connectDB();
    const ride = await Ride.findByIdAndUpdate(_id, data, { new: true });
    
    if (!ride) {
      return NextResponse.json({ 
        error: 'Fahrt nicht gefunden'
      }, { status: 404 });
    }
    
    return NextResponse.json({ ride });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Fahrt:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Keine Fahrt-ID angegeben'
      }, { status: 400 });
    }
    
    await connectDB();
    const ride = await Ride.findByIdAndDelete(id);
    
    if (!ride) {
      return NextResponse.json({ 
        error: 'Fahrt nicht gefunden'
      }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Fahrt:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 