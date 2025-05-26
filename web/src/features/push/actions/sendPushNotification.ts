"use server";

import { sendPushNotification, sendPushNotificationToDevice, PushNotificationPayload } from '../services/pushService';

export async function sendPushNotificationAction(payload: PushNotificationPayload) {
  return await sendPushNotification(payload);
}

// NEU: Push-Nachricht an spezifisches Gerät senden
export async function sendPushNotificationToDeviceAction(deviceId: string, payload: PushNotificationPayload) {
  return await sendPushNotificationToDevice(deviceId, payload);
} 