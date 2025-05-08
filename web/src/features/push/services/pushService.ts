import { webPushService } from '@/lib/webpush/webPushService';
import { logger } from '@/lib/logger';
import { isServicesInitialized } from '@/lib/init';
import { Subscriber } from '@/lib/db/models/Subscriber';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: any;
  deviceId: string;
}

export async function sendPushNotification(payload: PushNotificationPayload) {
  if (!isServicesInitialized()) {
    throw new Error('Services sind nicht initialisiert');
  }
  if (!payload.title || !payload.body) {
    throw new Error('Fehlende Pflichtfelder');
  }
  await webPushService.sendNotificationToAll(payload);
  return { status: 'success', message: 'Benachrichtigungen erfolgreich gesendet' };
}

export async function subscribePush(payload: PushSubscriptionPayload) {
  if (!isServicesInitialized()) {
    throw new Error('Services sind nicht initialisiert');
  }
  const { endpoint, keys, deviceId } = payload;
  if (!endpoint || !keys || !deviceId) {
    throw new Error('Fehlende Pflichtfelder');
  }
  const existingSubscriber = await Subscriber.findOne({ deviceId }).exec();
  if (existingSubscriber) {
    existingSubscriber.endpoint = endpoint;
    existingSubscriber.keys = keys;
    await existingSubscriber.save();
    logger.info('[Push/Subscribe] Existierender Subscriber aktualisiert', { deviceId });
  } else {
    await Subscriber.create({ deviceId, endpoint, keys });
    logger.info('[Push/Subscribe] Neuer Subscriber erstellt', { deviceId });
  }
  return { status: 'success', message: 'Subscription erfolgreich gespeichert' };
} 