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
  deviceId: string | null;
}

export default function PushNotificationSettings({ isSubscribed, deviceId }: PushNotificationSettingsProps) {
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
            const deviceId = localStorage.getItem('deviceId');
            logger.info('Gefundene deviceId:', deviceId);
            if (deviceId) {
              // Prüfe ob die Subscription in der Datenbank existiert
              const { exists } = await checkSubscription(deviceId);
              logger.info('Subscription in DB exists:', exists);
              if (exists) {
                const subscriptionData: PushSubscriptionData = {
                  endpoint: pushSubscription.endpoint,
                  keys: {
                    p256dh: btoa(String.fromCharCode.apply(null, 
                      Array.from(new Uint8Array(pushSubscription.getKey('p256dh') || new ArrayBuffer(0))))),
                    auth: btoa(String.fromCharCode.apply(null, 
                      Array.from(new Uint8Array(pushSubscription.getKey('auth') || new ArrayBuffer(0))))),
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
  }, []);

  const handleSubscribe = async () => {
    if (isLoading || !isSupported || isEnabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID();
      localStorage.setItem('deviceId', deviceId);

      const subscriptionData: PushSubscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, 
            Array.from(new Uint8Array(pushSubscription.getKey('p256dh') || new ArrayBuffer(0))))),
          auth: btoa(String.fromCharCode.apply(null, 
            Array.from(new Uint8Array(pushSubscription.getKey('auth') || new ArrayBuffer(0))))),
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
    <div className="p-4 sm:p-6">
      <div className="flex flex-row items-center justify-between gap-4">
        <span className="text-[#ff9900] font-medium text-lg">Push</span>
        <Switch
          checked={isEnabled}
          onCheckedChange={isEnabled ? handleUnsubscribe : handleSubscribe}
          disabled={isLoading || !isSupported || !isDeviceReady}
        />
      </div>
      <p className="text-[#ff9900]/60 text-sm mt-1">Benachrichtigungen</p>
      {!isSupported && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Nicht unterstützt</AlertTitle>
          <AlertDescription>
            Push-Benachrichtigungen werden von deinem Browser nicht unterstützt.
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {showDebug && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#ff9900] font-medium">Debug-Informationen</h3>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full ${debugInfo.notificationsSupported ? 'bg-green-500' : 'bg-red-500'}`} title="Notifications API" />
              <div className={`w-2 h-2 rounded-full ${debugInfo.serviceWorkerSupported ? 'bg-green-500' : 'bg-red-500'}`} title="Service Worker" />
              <div className={`w-2 h-2 rounded-full ${debugInfo.pushManagerSupported ? 'bg-green-500' : 'bg-red-500'}`} title="Push Manager" />
              <div className={`w-2 h-2 rounded-full ${debugInfo.subscription ? 'bg-green-500' : 'bg-yellow-500'}`} title="Subscription" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-[#460b6c]/20">
                  <th className="text-left py-2 px-2 sm:px-4 text-[#ff9900]/60">Eigenschaft</th>
                  <th className="text-left py-2 px-2 sm:px-4 text-[#ff9900]/60">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#460b6c]/10">
                  <td className="py-2 px-2 sm:px-4 text-[#ff9900]/60">Notifications API</td>
                  <td className="py-2 px-2 sm:px-4">
                    <div className={`w-3 h-3 rounded-full ${debugInfo.notificationsSupported ? 'bg-green-500' : 'bg-red-500'}`} />
                  </td>
                </tr>
                <tr className="border-b border-[#460b6c]/10">
                  <td className="py-2 px-2 sm:px-4 text-[#ff9900]/60">Service Worker</td>
                  <td className="py-2 px-2 sm:px-4">
                    <div className={`w-3 h-3 rounded-full ${debugInfo.serviceWorkerSupported ? 'bg-green-500' : 'bg-red-500'}`} />
                  </td>
                </tr>
                <tr className="border-b border-[#460b6c]/10">
                  <td className="py-2 px-2 sm:px-4 text-[#ff9900]/60">Push Manager</td>
                  <td className="py-2 px-2 sm:px-4">
                    <div className={`w-3 h-3 rounded-full ${debugInfo.pushManagerSupported ? 'bg-green-500' : 'bg-red-500'}`} />
                  </td>
                </tr>
                <tr className="border-b border-[#460b6c]/10">
                  <td className="py-2 px-2 sm:px-4 text-[#ff9900]/60">Service Worker Status</td>
                  <td className="py-2 px-2 sm:px-4">{debugInfo.serviceWorkerState || 'Nicht verfügbar'}</td>
                </tr>
                <tr className="border-b border-[#460b6c]/10">
                  <td className="py-2 px-2 sm:px-4 text-[#ff9900]/60">VAPID Key</td>
                  <td className="py-2 px-2 sm:px-4 truncate max-w-[200px] sm:max-w-xs">{debugInfo.vapidKey}</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 sm:px-4 text-[#ff9900]/60">Subscription</td>
                  <td className="py-2 px-2 sm:px-4">
                    <div className={`w-3 h-3 rounded-full ${debugInfo.subscription ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
