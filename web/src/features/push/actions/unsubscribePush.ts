"use server";
import { Subscriber } from '@/lib/db/models/Subscriber';
import { unsubscribePush } from '../services/pushService';

export async function unsubscribePushAction(endpoint: string) {
  await unsubscribePush(endpoint);
} 