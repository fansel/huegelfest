import { initServices } from '@/lib/initServices';
import { webPushService } from '@/lib/webpush/webPushService';
import { logger } from '@/lib/logger';
import { Subscriber } from '@/lib/db/models/Subscriber';
import { verifySession } from '@/features/auth/actions/userAuth';
import { db } from '@/lib/db';

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
}

/**
 * Sendet eine Push-Nachricht an einen spezifischen Benutzer
 * SICHERHEIT: userId wird aus der Session extrahiert
 */
export async function sendPushNotificationToUser(userId: string, payload: PushNotificationPayload) {
  await initServices();
  
  try {
    const result = await webPushService.sendNotificationToUser(userId, payload);
    logger.info('[Push/SendToUser] Benachrichtigung gesendet', { userId, success: result.success });
    return result;
  } catch (error) {
    logger.error('[Push/SendToUser] Fehler beim Senden der Benachrichtigung', {
      userId,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Sendet Push-Nachricht an alle registrierten Benutzer
 */
export async function sendPushNotificationToAll(payload: PushNotificationPayload) {
  await initServices();
  return await webPushService.sendNotificationToAll(payload);
}

/**
 * Server Action: Erstellt oder aktualisiert eine Push-Subscription
 * - Mit Session: Erstellt/aktualisiert eine user-gebundene Subscription
 * - Ohne Session: Erstellt/aktualisiert eine anonyme Subscription
 * Verhindert Duplikate pro Endpoint und Typ (anonym/user)
 */
export async function subscribePush(payload: PushSubscriptionPayload) {
  await initServices();

  // Session validieren und userId extrahieren
  let sessionData = null;
  try {
    sessionData = await verifySession();
  } catch {}

  const { endpoint, keys } = payload;
  const userId = sessionData?.userId;

  if (!endpoint || !keys) {
    throw new Error('Fehlende Pflichtfelder');
  }

  // 1. Prüfe existierende Subscriptions für diesen Endpoint
  const existingSubscriptions = await Subscriber.find({ endpoint }).exec();
  
  if (userId) {
    // Mit Login: User-gebundene Subscription
    const existingUserSub = existingSubscriptions.find(sub => sub.userId === userId);
    const existingAnonymousSub = existingSubscriptions.find(sub => !sub.userId);

    if (existingUserSub) {
      // Update existierende user-gebundene Subscription
      existingUserSub.keys = keys;
      await existingUserSub.save();
      logger.info('[Push/Subscribe] User-Subscription aktualisiert', { endpoint, userId });
    } else if (existingAnonymousSub) {
      // Erweitere existierende anonyme Subscription um User-ID
      existingAnonymousSub.userId = userId;
      existingAnonymousSub.keys = keys;
      await existingAnonymousSub.save();
      logger.info('[Push/Subscribe] Anonyme Subscription zu User-Subscription erweitert', { endpoint, userId });
    } else {
      // Keine Subscription gefunden, aber Browser-Permission könnte existieren
      // Neue user-gebundene Subscription erstellen
      await Subscriber.create({ userId, endpoint, keys });
      logger.info('[Push/Subscribe] Neue User-Subscription erstellt (nach Login mit Berechtigung)', { endpoint, userId });
    }
  } else {
    // Ohne Login: Anonyme Subscription
    const existingAnonymousSub = existingSubscriptions.find(sub => !sub.userId);
    const existingUserSub = existingSubscriptions.find(sub => sub.userId); // Für den Fall einer vorherigen User-Subscription

    if (existingAnonymousSub) {
      // Update existierende anonyme Subscription
      existingAnonymousSub.keys = keys;
      await existingAnonymousSub.save();
      logger.info('[Push/Subscribe] Anonyme Subscription aktualisiert', { endpoint });
    } else if (existingUserSub) {
      // Vorherige User-Subscription zu anonymer Subscription machen
      existingUserSub.userId = undefined;
      existingUserSub.keys = keys;
      await existingUserSub.save();
      logger.info('[Push/Subscribe] User-Subscription zu anonymer Subscription konvertiert', { endpoint });
    } else {
      // Neue anonyme Subscription
      await Subscriber.create({ endpoint, keys });
      logger.info('[Push/Subscribe] Neue anonyme Subscription erstellt', { endpoint });
    }
  }

  return { status: 'success', message: 'Subscription erfolgreich gespeichert' };
}

/**
 * Entfernt eine Push-Subscription
 * @param endpoint Die Endpoint-URL der Subscription
 * @param userId Optional: Wenn angegeben, wird nur die User-Verknüpfung entfernt
 */
export async function unsubscribePush(endpoint: string, userId?: string) {
  await initServices();
  
  try {
    // Wenn eine userId übergeben wird, NIEMALS die Subscription löschen
    if (userId) {
      const result = await Subscriber.updateOne(
        { endpoint },
        { $unset: { userId: 1 } }
      );
      
      if (result.modifiedCount > 0) {
        logger.info('[Push/Unsubscribe] User-Verknüpfung entfernt', { endpoint, userId });
      } else {
        logger.warn('[Push/Unsubscribe] Keine Änderung vorgenommen', { endpoint, userId });
      }
    } else {
      // Nur wenn KEINE userId übergeben wird, komplette Subscription entfernen
      await Subscriber.deleteOne({ endpoint });
      logger.info('[Push/Unsubscribe] Subscription komplett gelöscht', { endpoint });
    }
    
    return { status: 'success', message: 'Subscription erfolgreich bearbeitet' };
  } catch (error) {
    logger.error('[Push/Unsubscribe] Fehler beim Bearbeiten der Subscription', { error, endpoint, userId });
    throw error;
  }
}
