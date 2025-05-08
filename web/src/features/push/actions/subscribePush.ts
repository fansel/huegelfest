"use server";

import { subscribePush, PushSubscriptionPayload } from '../services/pushService';

export async function subscribePushAction(payload: PushSubscriptionPayload) {
  return await subscribePush(payload);
} 