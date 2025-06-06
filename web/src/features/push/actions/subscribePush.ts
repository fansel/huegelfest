"use server";

import { subscribePush } from '../services/pushService';

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export async function subscribePushAction(subscription: PushSubscriptionPayload) {
  return await subscribePush(subscription);
} 