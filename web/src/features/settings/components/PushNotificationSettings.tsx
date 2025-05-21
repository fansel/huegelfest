'use client';

import { useState, useEffect } from 'react';
import { env } from 'next-runtime-env';
import { subscribePushAction } from '@/features/push/actions/subscribePush';
import { checkSubscription } from '@/features/push/actions/checkSubscription';
import { unsubscribePushAction } from '@/features/push/actions/unsubscribePush';
import { logger } from '@/lib/logger';
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/shared/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/components/ui/card";
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import UserSettingsCard from './UserSettingsCard';
import { Bell } from 'lucide-react';

// VAPID-Schlüssel als Konstanten
const VAPID_PUBLIC_KEY = env('NEXT_PUBLIC_VAPID_PUBLIC_KEY');

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface DebugInfo {
  notificationsSupported: boolean;
  serviceWorkerSupported: boolean;
  pushManagerSupported: boolean;
  vapidKey: string;
  serviceWorkerState?: string;
  subscription?: PushSubscriptionData | null;
}

interface PushNotificationSettingsProps {
  isSubscribed: boolean;
  variant?: 'row' | 'tile';
}

export default function PushNotificationSettings({ isSubscribed, variant = 'row' }: PushNotificationSettingsProps) {
  const deviceId = useDeviceId();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null);
  const [isEnabled, setIsEnabled] = useState(isSubscribed);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    notificationsSupported: false,
    serviceWorkerSupported: false,
    pushManagerSupported: false,
    vapidKey: VAPID_PUBLIC_KEY || 'Nicht gesetzt'
  });

  const isDeviceReady = !!deviceId;

  useEffect(() => {
    if (!deviceId) return;
    const checkSupport = async () => {
      logger.info('Starte Push-Settings Check');
      const notificationsSupported = 'Notification' in window;
      const serviceWorkerSupported = 'serviceWorker' in navigator;
      const pushManagerSupported = 'PushManager' in window;
      logger.info('Support:', { notificationsSupported, serviceWorkerSupported, pushManagerSupported });

      setIsSupported(notificationsSupported && serviceWorkerSupported && pushManagerSupported);
      setPermission(Notification.permission);
      logger.info('Notification Permission:', Notification.permission);

      if (serviceWorkerSupported) {
        try {
          logger.info('Warte auf Service Worker Registrierung...');
          const registration = await navigator.serviceWorker.ready;
          logger.info('Service Worker ready:', registration);
          const pushSubscription = await registration.pushManager.getSubscription();
          logger.info('Push Subscription:', pushSubscription);
          
          if (pushSubscription) {
            logger.info('Gefundene deviceId:', deviceId);
            if (deviceId) {
              // Prüfe ob die Subscription in der Datenbank existiert
              const { exists } = await checkSubscription(deviceId);
              logger.info('Subscription in DB exists:', exists);
              if (exists) {
                const p256dhKey = pushSubscription.getKey('p256dh');
                const authKey = pushSubscription.getKey('auth');
                const p256dh = p256dhKey
                  ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey))))
                  : '';
                const auth = authKey
                  ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey))))
                  : '';
                const subscriptionData: PushSubscriptionData = {
                  endpoint: pushSubscription.endpoint,
                  keys: {
                    p256dh,
                    auth,
                  }
                };
                setSubscription(subscriptionData);
                setIsEnabled(true);
                logger.info('Subscription erfolgreich gesetzt', subscriptionData);
              } else {
                // Subscription existiert nicht in der Datenbank, also abbestellen
                logger.info('Subscription nicht in DB, unsubscribing...');
                await pushSubscription.unsubscribe();
                setSubscription(null);
                setIsEnabled(false);
              }
            } else {
              logger.warn('Keine deviceId im localStorage gefunden');
            }
          } else {
            logger.info('Kein PushSubscription im Browser gefunden');
          }
        } catch (error) {
          console.error('Fehler beim Prüfen des Subscription-Status:', error);
          logger.error('Fehler beim Prüfen des Subscription-Status', error);
        }
      } else {
        logger.warn('Service Worker wird nicht unterstützt');
      }
      
      setDebugInfo(prev => ({ 
        ...prev, 
        notificationsSupported,
        serviceWorkerSupported,
        pushManagerSupported,
        serviceWorkerState: serviceWorkerSupported ? 'Registriert' : 'Nicht unterstützt'
      }));
      setIsLoading(false);
      logger.info('Push-Settings Check abgeschlossen');
    };
    checkSupport();
  }, [deviceId]);

  const handleSubscribe = async () => {
    if (isLoading || !isSupported || isEnabled || !deviceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      const p256dhKey = pushSubscription.getKey('p256dh');
      const authKey = pushSubscription.getKey('auth');
      const p256dh = p256dhKey
        ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey))))
        : '';
      const auth = authKey
        ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey))))
        : '';
      const subscriptionData: PushSubscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh,
          auth,
        }
      };

      await subscribePushAction({ ...subscriptionData, deviceId });

      setSubscription(subscriptionData);
      setIsEnabled(true);
      setDebugInfo(prev => ({
        ...prev,
        subscription: subscriptionData
      }));
    } catch (error) {
      console.error('Fehler beim Abonnieren:', error);
      logger.error('Fehler beim Abonnieren der Push-Benachrichtigungen', error);
      setError('Fehler beim Abonnieren der Push-Benachrichtigungen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (isLoading || !isSupported || !isEnabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        await unsubscribePushAction(pushSubscription.endpoint);
      }

      setSubscription(null);
      setIsEnabled(false);
      setDebugInfo(prev => ({
        ...prev,
        subscription: null
      }));
    } catch (error) {
      console.error('Fehler beim Abbestellen:', error);
      logger.error('Fehler beim Abbestellen der Push-Benachrichtigungen', error);
      setError('Fehler beim Abbestellen der Push-Benachrichtigungen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!isEnabled) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Test-Benachrichtigung', {
        body: 'Dies ist eine Test-Benachrichtigung',
        icon: '/icon-192x192.png',
        badge: '/badge-96x96.png'
      });
    } catch (error) {
      console.error('Fehler beim Senden der Test-Benachrichtigung:', error);
      logger.error('Fehler beim Senden der Test-Benachrichtigung', error);
      setError('Fehler beim Senden der Test-Benachrichtigung');
    }
  };

  return (
    <UserSettingsCard
      icon={<Bell className="w-5 h-5 text-[#ff9900]" />}
      title="Push-Benachrichtigungen"
      switchElement={
        <div className="flex items-center gap-1">
          <Switch
            checked={isEnabled}
            onCheckedChange={isEnabled ? handleUnsubscribe : handleSubscribe}
            disabled={isLoading || !isSupported || !isDeviceReady}
          />
        </div>
      }
      info="Erhalte wichtige Festival-Infos direkt aufs Gerät. Aktiviere Push, um keine Updates zu verpassen."
      variant={variant}
    />
  );
}
