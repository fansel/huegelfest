import { initServices } from '@/lib/initServices';
import { webPushService } from '@/lib/webpush/webPushService';
import { logger } from '@/lib/logger';
import { isServicesInitialized } from '../../../../scripts/init';
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
  await initServices();
  if (webPushService.isInitialized()) {
    await webPushService.sendNotificationToAll(payload);
  }
  return { status: 'success', message: 'Benachrichtigungen erfolgreich gesendet' };
}

export async function subscribePush(payload: PushSubscriptionPayload) {
  await initServices();
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