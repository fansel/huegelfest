"use server";

import { Subscriber } from '@/lib/db/models/Subscriber';

export async function checkSubscription(deviceId: string): Promise<{ exists: boolean }> {
  if (!deviceId) return { exists: false };
  const subscriber = await Subscriber.findOne({ deviceId }).exec();
  return { exists: !!subscriber };
} 