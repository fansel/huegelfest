import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    clientId: process.env.SOUNDCLOUD_CLIENT_ID
  });
} 