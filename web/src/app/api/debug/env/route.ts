import { NextResponse } from 'next/server';
import { env } from 'next-runtime-env';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    vapidPublicKey: env('NEXT_PUBLIC_VAPID_PUBLIC_KEY'),
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ? '***' : undefined,
    nodeEnv: process.env.NODE_ENV,
    runtime: process.env.NEXT_RUNTIME,
    allEnv: Object.keys(process.env).reduce((acc, key) => {
      if (key.includes('VAPID') || key.includes('NEXT')) {
        acc[key] = process.env[key] ? '***' : undefined;
      }
      return acc;
    }, {} as Record<string, string | undefined>)
  });
} 