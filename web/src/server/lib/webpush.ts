import webpush from 'web-push';
import { Subscriber } from '@/database/models/Subscriber';

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

// Gültiger Dummy-VAPID-Key (65 Bytes Base64-kodiert)
const DUMMY_VAPID_PUBLIC_KEY = 'BP4z9KsN6nGRTbVSwIx7TpCuRqam5rJkFZJtPvN1YMMGzKcF1oG3cJbL2vX5nQ8wT3mK9pR7sY4tH1jL6xN';
const DUMMY_VAPID_PRIVATE_KEY = 'dummy_private_key';

class WebPushService {
  private initialized = false;

  initialize() {
    if (this.initialized) return;

    // Nur auf der Server-Seite initialisieren
    if (typeof window === 'undefined') {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DUMMY_VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || DUMMY_VAPID_PRIVATE_KEY;

      // Validiere nur in Produktion
      if (process.env.NODE_ENV === 'production') {
        if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
          console.warn('VAPID-Schlüssel fehlen in den Umgebungsvariablen. Push-Benachrichtigungen sind deaktiviert.');
          return;
        }
      }

      webpush.setVapidDetails(
        'mailto:vapid@hey.fansel.dev',
        vapidPublicKey,
        vapidPrivateKey
      );
    }

    this.initialized = true;
  }

  isInitialized() {
    return this.initialized;
  }

  async sendNotificationToAll(payload: PushNotificationPayload) {
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
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DUMMY_VAPID_PUBLIC_KEY;
  }
}

// Singleton-Instanz erstellen
export const webPushService = new WebPushService();

// Initialisiere den Service nur auf der Server-Seite
if (typeof window === 'undefined') {
  webPushService.initialize();
}
