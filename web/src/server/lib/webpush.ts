import webpush from 'web-push';
import { Subscriber } from '@/database/models/Subscriber';

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

export class WebPushService {
  private static instance: WebPushService;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): WebPushService {
    if (!WebPushService.instance) {
      WebPushService.instance = new WebPushService();
    }
    return WebPushService.instance;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public initialize(): void {
    if (this.initialized) return;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('VAPID-Keys fehlen. Push-Benachrichtigungen werden deaktiviert.');
      this.initialized = false;
      return;
    }

    try {
      webpush.setVapidDetails(
        'mailto:vapid@hey.fansel.dev',
        vapidPublicKey,
        vapidPrivateKey
      );
      this.initialized = true;
    } catch (error) {
      console.warn('Fehler beim Initialisieren des WebPush-Services:', error);
      this.initialized = false;
    }
  }

  public async sendNotificationToAll(payload: PushNotificationPayload): Promise<void> {
    if (!this.initialized) {
      console.warn('WebPushService nicht initialisiert. Push-Benachrichtigung wird nicht gesendet.');
      return;
    }

    try {
      const subscribers = await Subscriber.find();
      
      for (const subscriber of subscribers) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscriber.endpoint,
              keys: subscriber.keys
            },
            JSON.stringify(payload)
          );
        } catch (error) {
          console.error('Fehler beim Senden der Benachrichtigung:', error);
          // Wenn der Subscriber nicht mehr gültig ist, entferne ihn
          if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
            await Subscriber.deleteOne({ _id: subscriber._id });
          }
        }
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Subscriber:', error);
    }
  }

  public getPublicKey(): string | undefined {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  }
}

// Erstelle eine Instanz, aber initialisiere sie nicht
export const webPushService = WebPushService.getInstance();
