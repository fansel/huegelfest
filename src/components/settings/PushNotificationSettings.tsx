'use client';

import { useState, useEffect } from 'react';

// VAPID-Schlüssel als Konstanten
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

if (!VAPID_PUBLIC_KEY) {
  throw new Error('VAPID Public Key fehlt in den Umgebungsvariablen');
}

export default function PushNotificationSettings() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    notificationsSupported: boolean;
    serviceWorkerSupported: boolean;
    pushManagerSupported: boolean;
    vapidKey: string;
    serviceWorkerState?: string;
    subscription?: PushSubscription | null;
  }>({
    notificationsSupported: false,
    serviceWorkerSupported: false,
    pushManagerSupported: false,
    vapidKey: VAPID_PUBLIC_KEY || 'Nicht gesetzt'
  });

  useEffect(() => {
    const checkSupport = async () => {
      const notificationsSupported = 'Notification' in window;
      const serviceWorkerSupported = 'serviceWorker' in navigator;
      const pushManagerSupported = 'PushManager' in window;

      setDebugInfo(prev => ({
        ...prev,
        notificationsSupported,
        serviceWorkerSupported,
        pushManagerSupported
      }));

      if (notificationsSupported && serviceWorkerSupported && pushManagerSupported) {
        setIsSupported(true);
        setPermission(Notification.permission);
        
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          setDebugInfo(prev => ({
            ...prev,
            serviceWorkerState: registration.active ? 'Aktiv' : 'Inaktiv'
          }));
          
          await navigator.serviceWorker.ready;
          
          const existingSubscription = await registration.pushManager.getSubscription();
          setDebugInfo(prev => ({
            ...prev,
            subscription: existingSubscription
          }));
          setSubscription(existingSubscription);
          setIsEnabled(!!existingSubscription);
        } catch (error) {
          console.error('Service Worker Fehler:', error);
        }
      }
    };

    checkSupport();
  }, []);

  const handleSubscribe = async () => {
    if (isLoading || !isSupported || isEnabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      setSubscription(subscription);
      setIsEnabled(true);
      setDebugInfo(prev => ({
        ...prev,
        subscription
      }));

      new Notification('Juhu! Das hat geklappt', {
        body: 'Push-Benachrichtigungen sind jetzt aktiviert.',
        icon: '/icon-192x192.png'
      });
    } catch (error) {
      console.error('Fehler beim Abonnieren:', error);
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
      if (subscription) {
        await subscription.unsubscribe();
        
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        });

        setSubscription(null);
        setIsEnabled(false);
        setDebugInfo(prev => ({
          ...prev,
          subscription: null
        }));
      }
    } catch (error) {
      console.error('Fehler beim Abbestellen:', error);
      setError('Fehler beim Abbestellen der Push-Benachrichtigungen');
    } finally {
      setIsLoading(false);
    }
  };

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
                  onClick={() => {
                    new Notification('Demo-Benachrichtigung', {
                      body: 'Dies ist eine Test-Benachrichtigung',
                      icon: '/icon-192x192.png'
                    });
                  }}
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