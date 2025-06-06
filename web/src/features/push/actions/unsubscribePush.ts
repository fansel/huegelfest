"use server";

import { unsubscribePush } from '../services/pushService';

export async function unsubscribePushAction(endpoint: string, userId?: string) {
  return await unsubscribePush(endpoint, userId);
} 