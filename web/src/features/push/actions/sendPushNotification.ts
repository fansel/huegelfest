"use server";

import { sendPushNotification, sendPushNotificationToDevice, PushNotificationPayload } from '../services/pushService';
import { webPushService } from '@/lib/webpush/webPushService';
import { initWebpush } from '@/lib/initWebpush';

export async function sendPushNotificationAction(notification: {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}) {
  try {
    await initWebpush();
    await webPushService.sendNotificationToAll(notification);
    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: 'Failed to send push notification' };
  }
}

/**
 * Admin-Aktion: Bereinigt ungültige Push-Subscriptions
 */
export async function cleanupInvalidSubscriptionsAction() {
  try {
    await initWebpush();
    const result = await webPushService.cleanupInvalidSubscriptions();
    return { 
      success: true, 
      message: `${result.removed} von ${result.total} ungültigen Subscriptions entfernt`,
      ...result 
    };
  } catch (error) {
    console.error('Error cleaning up push subscriptions:', error);
    return { success: false, error: 'Failed to cleanup push subscriptions' };
  }
}

// NEU: Push-Nachricht an spezifisches Gerät senden
export async function sendPushNotificationToDeviceAction(deviceId: string, payload: PushNotificationPayload) {
  return await sendPushNotificationToDevice(deviceId, payload);
} 