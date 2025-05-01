import { NextResponse } from 'next/server';
import { connectDB } from '@/database/config/connector';

export async function GET() {
  try {
    // Prüfe Datenbankverbindung
    await connectDB();
    
    return NextResponse.json({ status: 'healthy' });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    );
  }
} 