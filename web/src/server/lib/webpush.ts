import webpush from 'web-push';
import { Subscriber } from '@/database/models/Subscriber';
import { logger } from '@/server/lib/logger';
import { env } from 'next-runtime-env';

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

    logger.info('[WebPush] Starte Initialisierung...');

    try {
      const vapidPublicKey = env('NEXT_PUBLIC_VAPID_PUBLIC_KEY');
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

      logger.info('[WebPush] Umgebungsvariablen Status:', {
        hasPublicKey: !!vapidPublicKey,
        hasPrivateKey: !!vapidPrivateKey,
        environment: process.env.NODE_ENV,
        publicKeyLength: vapidPublicKey?.length || 0,
        privateKeyLength: vapidPrivateKey?.length || 0
      });

      // Validiere nur in Produktion
      if (process.env.NODE_ENV === 'production') {
        if (!vapidPublicKey || !vapidPrivateKey) {
          logger.error('[WebPush] VAPID-Schlüssel fehlen in den Umgebungsvariablen', {
            missingPublicKey: !vapidPublicKey,
            missingPrivateKey: !vapidPrivateKey
          });
          return;
        }
      }

      webpush.setVapidDetails(
        'mailto:vapid@hey.fansel.dev',
        vapidPublicKey || '',
        vapidPrivateKey || ''
      );
      logger.info('[WebPush] VAPID-Details erfolgreich gesetzt', {
        contact: 'mailto:vapid@hey.fansel.dev',
        publicKeySet: !!vapidPublicKey,
        privateKeySet: !!vapidPrivateKey
      });
      this.initialized = true;
      logger.info('[WebPush] Service erfolgreich initialisiert');
    } catch (error) {
      logger.error('[WebPush] Fehler bei der VAPID-Initialisierung:', {
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  isInitialized() {
    logger.debug('[WebPush] Initialisierungsstatus prüfen:', { initialized: this.initialized });
    return this.initialized;
  }

  async sendNotificationToAll(payload: PushNotificationPayload) {
    if (!this.initialized) {
      logger.error('[WebPush] Service ist nicht initialisiert');
      return;
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

        return webpush.sendNotification(subscription, JSON.stringify(payload))
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
    const key = env('NEXT_PUBLIC_VAPID_PUBLIC_KEY') || '';
    logger.debug('[WebPush] Öffentlicher Schlüssel abgerufen', {
      hasKey: !!key,
      keyLength: key.length
    });
    return key;
  }
}

// Singleton-Instanz erstellen
export const webPushService = new WebPushService();
