"use server";

import { sendPushNotification, PushNotificationPayload } from '../services/pushService';

export async function sendPushNotificationAction(payload: PushNotificationPayload) {
  return await sendPushNotification(payload);
} 