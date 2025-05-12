"use server";
import { Subscriber } from '@/lib/db/models/Subscriber';

export async function unsubscribePushAction(endpoint: string): Promise<{ success: boolean }> {
  if (!endpoint) return { success: false };
  await Subscriber.deleteOne({ endpoint });
  return { success: true };
} 