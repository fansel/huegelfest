import webpush from 'web-push';
import { Subscriber } from '@/database/models/Subscriber';

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

// Prüfe ob wir in der Edge-Runtime sind
const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge';

export class WebPushService {
  private initialized = false;

  initialize() {
    if (this.initialized) return;

    // Überspringe Initialisierung in der Edge-Runtime
    if (isEdgeRuntime) {
      console.warn('WebPush-Initialisierung in Edge-Runtime übersprungen');
      return;
    }

    // Nur auf der Server-Seite initialisieren
    if (typeof window === 'undefined') {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

      // Validiere nur in Produktion
      if (process.env.NODE_ENV === 'production') {
        if (!vapidPublicKey || !vapidPrivateKey) {
          console.warn('VAPID-Schlüssel fehlen in den Umgebungsvariablen. Push-Benachrichtigungen sind deaktiviert.');
          return;
        }
      }

      try {
        webpush.setVapidDetails(
          'mailto:vapid@hey.fansel.dev',
          vapidPublicKey || '',
          vapidPrivateKey || ''
        );
      } catch (error) {
        console.warn('Fehler bei der VAPID-Initialisierung:', error);
        return;
      }
    }

    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }

  async sendNotificationToAll(payload: PushNotificationPayload) {
    // Überspringe Senden in der Edge-Runtime
    if (isEdgeRuntime) {
      console.warn('Push-Benachrichtigungen in Edge-Runtime nicht unterstützt');
      return;
    }

    if (!this.initialized) {
      console.warn('WebPush-Service ist nicht initialisiert. Push-Benachrichtigung wird nicht gesendet.');
      return;
    }

    try {
      const subscribers = await Subscriber.find();
      const notifications = subscribers.map(subscriber => {
        const subscription = {
          endpoint: subscriber.endpoint,
          keys: subscriber.keys
        };
        return webpush.sendNotification(subscription, JSON.stringify(payload))
          .catch(error => {
            if (error.statusCode === 410) {
              // Subscription ist abgelaufen, entferne sie
              return Subscriber.findByIdAndDelete(subscriber._id);
            }
            throw error;
          });
      });

      await Promise.allSettled(notifications);
    } catch (error) {
      console.error('Fehler beim Senden der Push-Benachrichtigungen:', error);
      throw error;
    }
  }

  getPublicKey(): string {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  }
}

// Singleton-Instanz erstellen
export const webPushService = new WebPushService();
