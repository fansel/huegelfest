"use server";

import { 
  sendPushNotificationToAll, 
  sendPushNotificationToUser,
  PushNotificationPayload 
} from '../services/pushService';

// Push-Nachricht an alle Benutzer senden
export async function sendPushNotificationAction(payload: PushNotificationPayload) {
  return await sendPushNotificationToAll(payload);
}

// Push-Nachricht an spezifischen Benutzer senden
export async function sendPushNotificationToUserAction(userId: string, payload: PushNotificationPayload) {
  return await sendPushNotificationToUser(userId, payload);
} 