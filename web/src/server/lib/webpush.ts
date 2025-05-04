import webpush from 'web-push';
import { Subscriber } from '@/database/models/Subscriber';
import { logger } from '@/server/lib/logger';

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

export class WebPushService {
  private initialized = false;

  initialize() {
    if (this.initialized) {
      logger.debug('[WebPush] Service bereits initialisiert');
      return;
    }

    // Nur auf der Server-Seite initialisieren
    if (typeof window === 'undefined') {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

      // Validiere nur in Produktion
      if (process.env.NODE_ENV === 'production') {
        if (!vapidPublicKey || !vapidPrivateKey) {
          logger.error('[WebPush] VAPID-Schlüssel fehlen in den Umgebungsvariablen');
          return;
        }
      }

      try {
        webpush.setVapidDetails(
          'mailto:vapid@hey.fansel.dev',
          vapidPublicKey || '',
          vapidPrivateKey || ''
        );
        logger.info('[WebPush] VAPID-Details erfolgreich gesetzt');
      } catch (error) {
        logger.error('[WebPush] Fehler bei der VAPID-Initialisierung:', error);
        return;
      }
    }

    this.initialized = true;
    logger.info('[WebPush] Service erfolgreich initialisiert');
  }

  isInitialized() {
    return this.initialized;
  }

  async sendNotificationToAll(payload: PushNotificationPayload) {
    if (!this.initialized) {
      logger.error('[WebPush] Service ist nicht initialisiert');
      return;
    }

    try {
      const subscriberCount = await Subscriber.countDocuments().exec();
      logger.info('[WebPush] Starte Senden der Benachrichtigungen', { 
        title: payload.title,
        subscribers: subscriberCount
      });

      const subscribers = await Subscriber.find().exec();
      const notifications = subscribers.map(subscriber => {
        const subscription = {
          endpoint: subscriber.endpoint,
          keys: subscriber.keys
        };
        return webpush.sendNotification(subscription, JSON.stringify(payload))
          .then(() => {
            logger.debug('[WebPush] Benachrichtigung erfolgreich gesendet', { 
              deviceId: subscriber.deviceId,
              endpoint: subscriber.endpoint.substring(0, 50) + '...'
            });
          })
          .catch(error => {
            if (error.statusCode === 410) {
              logger.info('[WebPush] Subscription abgelaufen, entferne sie', { 
                deviceId: subscriber.deviceId 
              });
              return Subscriber.findByIdAndDelete(subscriber._id).exec();
            }
            logger.error('[WebPush] Fehler beim Senden der Benachrichtigung', {
              deviceId: subscriber.deviceId,
              error: error.message
            });
            throw error;
          });
      });

      const results = await Promise.allSettled(notifications);
      const stats = {
        total: results.length,
        fulfilled: results.filter(r => r.status === 'fulfilled').length,
        rejected: results.filter(r => r.status === 'rejected').length
      };
      
      logger.info('[WebPush] Senden der Benachrichtigungen abgeschlossen', stats);
    } catch (error) {
      logger.error('[WebPush] Fehler beim Senden der Push-Benachrichtigungen:', error);
      throw error;
    }
  }

  getPublicKey(): string {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  }
}

// Singleton-Instanz erstellen
export const webPushService = new WebPushService();
