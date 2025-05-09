import webpush from 'web-push';
import { Subscriber } from '../db/models/Subscriber.ts';
import { logger } from '../logger.ts';

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

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): WebPushService {
    if (!WebPushService.instance) {
      WebPushService.instance = new WebPushService();
    }
    return WebPushService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      logger.error('VAPID-Schlüssel nicht gefunden. WebPush wird nicht initialisiert.');
      logger.error(vapidPublicKey);
      logger.error(vapidPrivateKey);
      return;
    }

    try {
      webpush.setVapidDetails(
        'mailto:info@huegelfest.fansel.dev',
        vapidPublicKey,
        vapidPrivateKey
      );
      this.initialized = true;
      console.log('WebPush-Service erfolgreich initialisiert');
    } catch (error) {
      console.error('Fehler bei der WebPush-Initialisierung:', error);
      throw error;
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async sendNotification(subscription: webpush.PushSubscription, payload: any): Promise<void> {
    if (!this.initialized) {
      throw new Error('WebPush-Service ist nicht initialisiert');
    }
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
      console.error('Fehler beim Senden der Benachrichtigung:', error);
      throw error;
    }
  }

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

      const subscribers = await Subscriber.find().exec();
      const subscriberCount = subscribers.length;
      
      logger.info('[WebPush] Gefundene Subscriber', { 
        count: subscriberCount,
        deviceIds: subscribers.map(s => s.deviceId)
      });

      if (subscriberCount === 0) {
        logger.warn('[WebPush] Keine Subscriber gefunden');
        return;
      }

      const notifications = subscribers.map(subscriber => {
        const subscription = {
          endpoint: subscriber.endpoint,
          keys: subscriber.keys
        };
        
        logger.debug('[WebPush] Sende Benachrichtigung an Subscriber', {
          deviceId: subscriber.deviceId,
          endpoint: subscriber.endpoint.substring(0, 50) + '...'
        });

        return this.sendNotification(subscription, payload)
          .then(() => {
            logger.info('[WebPush] Benachrichtigung erfolgreich gesendet', { 
              deviceId: subscriber.deviceId,
              endpoint: subscriber.endpoint.substring(0, 50) + '...',
              timestamp: new Date().toISOString()
            });
          })
          .catch(error => {
            if (error.statusCode === 410) {
              logger.warn('[WebPush] Subscription abgelaufen, entferne sie', { 
                deviceId: subscriber.deviceId,
                endpoint: subscriber.endpoint.substring(0, 50) + '...',
                errorCode: error.statusCode
              });
              return Subscriber.findByIdAndDelete(subscriber._id).exec();
            }
            logger.error('[WebPush] Fehler beim Senden der Benachrichtigung', {
              deviceId: subscriber.deviceId,
              error: error.message,
              statusCode: error.statusCode,
              endpoint: subscriber.endpoint.substring(0, 50) + '...'
            });
            throw error;
          });
      });

      const results = await Promise.allSettled(notifications);
      const stats = {
        total: results.length,
        fulfilled: results.filter(r => r.status === 'fulfilled').length,
        rejected: results.filter(r => r.status === 'rejected').length,
        timestamp: new Date().toISOString()
      };
      
      logger.info('[WebPush] Senden der Benachrichtigungen abgeschlossen', stats);
    } catch (error) {
      logger.error('[WebPush] Fehler beim Senden der Push-Benachrichtigungen:', {
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  getPublicKey(): string {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    logger.debug('[WebPush] Öffentlicher Schlüssel abgerufen', {
      hasKey: !!key,
      keyLength: key.length
    });
    return key;
  }
}

export const webPushService = WebPushService.getInstance();
