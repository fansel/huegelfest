import { NextResponse } from 'next/server';
import { connectDB } from '@/database/config/connector';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: 'success', message: 'MongoDB connection successful' });
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { status: 'error', message: 'MongoDB connection failed', error: error.message },
      { status: 500 }
    );
  }
} 