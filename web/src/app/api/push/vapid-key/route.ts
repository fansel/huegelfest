import { NextResponse } from 'next/server';
import { env } from 'next-runtime-env';

export async function GET() {
  return NextResponse.json({
    publicKey: env('NEXT_PUBLIC_VAPID_PUBLIC_KEY') || 'dummy_public_key'
  });
} 