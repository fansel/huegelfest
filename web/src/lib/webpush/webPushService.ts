import webpush from 'web-push';
import { Subscriber } from '../db/models/Subscriber';
import { logger } from '../logger';

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

class WebPushService {
  private static instance: WebPushService;
  private initialized = false;

  private constructor() {}

  static getInstance(): WebPushService {
    if (!WebPushService.instance) {
      WebPushService.instance = new WebPushService();
    }
    return WebPushService.instance;
  }

  initialize(publicKey: string, privateKey: string, email?: string) {
    try {
      webpush.setVapidDetails(
        email || 'mailto:info@huegelfest.de',
        publicKey,
        privateKey
      );
      this.initialized = true;
      logger.info('[WebPush] Service erfolgreich initialisiert');
    } catch (error) {
      logger.error('[WebPush] Fehler bei der Initialisierung:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private async sendNotification(subscription: any, payload: PushNotificationPayload) {
    if (!this.initialized) {
      throw new Error('WebPush-Service ist nicht initialisiert');
    }

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error: any) {
      // Bei 404 oder 410: Subscription ist ungültig
      if (error.statusCode === 404 || error.statusCode === 410) {
        logger.warn('[WebPush] Ungültige Subscription gefunden, wird entfernt', {
          endpoint: subscription.endpoint,
          statusCode: error.statusCode
        });
        await Subscriber.findOneAndDelete({ endpoint: subscription.endpoint });
      } else {
        logger.error('[WebPush] Fehler beim Senden der Benachrichtigung:', {
          error: error.message,
          statusCode: error.statusCode,
          headers: error.headers
        });
      }
      throw error;
    }
  }

  /**
   * Sendet eine Push-Nachricht an einen spezifischen Benutzer (alle Geräte)
   */
  async sendNotificationToUser(userId: string, payload: PushNotificationPayload) {
    if (!this.initialized) {
      logger.error('[WebPush] Service ist nicht initialisiert');
      throw new Error('WebPush-Service ist nicht initialisiert');
    }

    try {
      logger.info('[WebPush] Sende Benachrichtigung an Benutzer', { 
        userId,
        title: payload.title,
        body: payload.body
      });

      // Sende an alle Subscriber mit userId (alle Geräte)
      const subscribers = await Subscriber.find({ userId }).exec();
      if (!subscribers || subscribers.length === 0) {
        logger.warn('[WebPush] Keine Subscription für Benutzer gefunden', { userId });
        return { success: false, error: 'Keine Push-Subscription für diesen Benutzer gefunden' };
      }

      // Sende parallel an alle Geräte des Users
      const results = await Promise.allSettled(
        subscribers.map(subscriber => {
          const subscription = {
            endpoint: subscriber.endpoint,
            keys: subscriber.keys
          };
          return this.sendNotification(subscription, payload);
        })
      );

      // Analysiere Ergebnisse
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      logger.info('[WebPush] Benachrichtigungen an User gesendet', {
        userId,
        total: subscribers.length,
        success: successCount,
        failed: failureCount
      });

      return { 
        success: successCount > 0,
        stats: {
          total: subscribers.length,
          success: successCount,
          failed: failureCount
        }
      };
    } catch (error) {
      logger.error('[WebPush] Fehler beim Senden der Benachrichtigung an Benutzer', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Sendet eine Push-Nachricht an alle Subscriber (allgemein + user-gebunden)
   */
  async sendNotificationToAll(payload: PushNotificationPayload) {
    if (!this.initialized) {
      logger.error('[WebPush] Service ist nicht initialisiert');
      throw new Error('WebPush-Service ist nicht initialisiert');
    }

    try {
      logger.info('[WebPush] Starte Senden der Benachrichtigungen', { 
        title: payload.title,
        body: payload.body,
        payloadSize: JSON.stringify(payload).length
      });

      // Sende an alle Subscriber (egal ob userId gesetzt oder nicht)
      const subscribers = await Subscriber.find().exec();
      const subscriberCount = subscribers.length;
      
      if (subscriberCount === 0) {
        logger.warn('[WebPush] Keine Subscriber gefunden');
        return { success: true, stats: { total: 0, success: 0, failed: 0 } };
      }

      // Sende parallel an alle Subscriber
      const results = await Promise.allSettled(
        subscribers.map(subscriber => {
          const subscription = {
            endpoint: subscriber.endpoint,
            keys: subscriber.keys
          };
          return this.sendNotification(subscription, payload);
        })
      );

      // Analysiere Ergebnisse
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      logger.info('[WebPush] Alle Benachrichtigungen abgeschlossen', {
        total: subscriberCount,
        success: successCount,
        failed: failureCount,
        timestamp: new Date().toISOString()
      });

      return {
        success: successCount > 0,
        stats: {
          total: subscriberCount,
          success: successCount,
          failed: failureCount
        }
      };
    } catch (error) {
      logger.error('[WebPush] Kritischer Fehler beim Senden aller Benachrichtigungen:', error);
      throw error;
    }
  }

  /**
   * Bereinigt ungültige Push-Subscriptions aus der Datenbank
   * Kann regelmäßig aufgerufen werden, um Datenbankgröße zu reduzieren
   */
  async cleanupInvalidSubscriptions(): Promise<{ removed: number; total: number }> {
    if (!this.initialized) {
      logger.warn('[WebPush] Service nicht initialisiert - Cleanup übersprungen');
      return { removed: 0, total: 0 };
    }

    try {
      const subscribers = await Subscriber.find().exec();
      const total = subscribers.length;
      let removed = 0;

      logger.info(`[WebPush] Cleanup: Prüfe ${total} Subscriptions`);

      for (const subscriber of subscribers) {
        try {
          // Test mit minimaler Payload
          const testPayload = { title: 'Test', body: 'Validierung', silent: true };
          const subscription = {
            endpoint: subscriber.endpoint,
            keys: subscriber.keys
          };
          
          await this.sendNotification(subscription, testPayload);
        } catch (error: any) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            logger.info(`[WebPush] Cleanup: Entferne ungültige Subscription für ${subscriber.userId}`);
            await Subscriber.findByIdAndDelete(subscriber._id).exec();
            removed++;
          }
        }
      }

      logger.info(`[WebPush] Cleanup abgeschlossen: ${removed}/${total} Subscriptions entfernt`);
      return { removed, total };
    } catch (error) {
      logger.error('[WebPush] Fehler beim Cleanup:', error);
      return { removed: 0, total: 0 };
    }
  }
}

export const webPushService = WebPushService.getInstance();

// Cleanup ungültige Subscriptions
export async function cleanupInvalidSubscriptions() {
  const subscribers = await Subscriber.find().exec();
  const invalidSubscribers = [];

  for (const subscriber of subscribers) {
    try {
      // Teste Subscription mit leerer Nachricht
      await webpush.sendNotification(
        {
          endpoint: subscriber.endpoint,
          keys: subscriber.keys
        },
        ''
      );
    } catch (error: any) {
      // HTTP 410 = Subscription nicht mehr gültig
      // HTTP 404 = Endpoint nicht gefunden
      if (error.statusCode === 410 || error.statusCode === 404) {
        invalidSubscribers.push(subscriber._id);
        logger.info('[WebPush] Ungültige Subscription gefunden', {
          endpoint: subscriber.endpoint,
          userId: subscriber.userId
        });
      }
    }
  }

  // Lösche ungültige Subscriptions
  if (invalidSubscribers.length > 0) {
    await Subscriber.deleteMany({ _id: { $in: invalidSubscribers } });
    logger.info('[WebPush] Ungültige Subscriptions gelöscht', {
      count: invalidSubscribers.length
    });
  }
}
