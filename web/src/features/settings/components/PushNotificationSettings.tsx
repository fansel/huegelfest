'use client';

import { useState, useEffect } from 'react';
import { env } from 'next-runtime-env';
import { subscribePushAction } from '@/features/push/actions/subscribePush';
import { checkSubscription } from '@/features/push/actions/checkSubscription';
import { unsubscribePushAction } from '@/features/push/actions/unsubscribePush';
import { logger } from '@/lib/logger';

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
  deviceId: string;
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

  if (isLoading) {
    return <div>Lade...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <span className="text-[#ff9900] font-medium">Push-Benachrichtigungen</span>
          <span className="text-[#ff9900]/60 text-sm">Erhalte Updates über neue Nachrichten</span>
        </div>
        <div className="flex items-center gap-4">
          {!isSupported ? (
            <span className="text-[#ff9900]/60 text-sm px-3 py-1 bg-[#460b6c]/20 rounded-full">Nicht unterstützt</span>
          ) : (
            <>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isEnabled}
                  onChange={isEnabled ? handleUnsubscribe : handleSubscribe}
                  disabled={isLoading}
                />
                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff9900] hover:bg-gray-300"></div>
              </label>
              {isEnabled && (
                <button
                  onClick={handleTestNotification}
                  className="text-[#ff9900]/60 hover:text-[#ff9900] transition-colors p-2 hover:bg-[#460b6c]/20 rounded-full"
                  title="Demo-Benachrichtigung senden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </button>
              )}
            </>
          )}

        <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-[#ff9900]/60 hover:text-[#ff9900] transition-colors p-2 hover:bg-[#460b6c]/20 rounded-full"
            title="Debug anzeigen/ausblenden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path d="M8.5 8.5v.01" />
              <path d="M16 15.5v.01" />
              <path d="M12 12v.01" />
              <path d="M11 17v.01" />
              <path d="M7 14v.01" />
            </svg>
        </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 text-red-200 rounded-lg border border-red-500/30 mt-4">
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {showDebug && (
        <div className="p-4 sm:p-6 bg-[#460b6c]/10 rounded-lg space-y-4 border border-[#460b6c]/20 mt-4">
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
