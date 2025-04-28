'use client';

import { useState, useEffect } from 'react';

// VAPID-Schlüssel als Konstanten
const VAPID_PUBLIC_KEY = 'BGaY-2eeg8pi2yNRIsLdm4SN4RmHTKdVwaeEdZeUpJSMv9isl12K0TadiH9GDDWo96r7OFFMPdurXoSEiu0nnH4';

export default function PushNotificationSettings() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'active' | 'inactive' | 'error'>('inactive');
  const [debugInfo, setDebugInfo] = useState<{
    notificationsSupported: boolean;
    serviceWorkerSupported: boolean;
    pushManagerSupported: boolean;
    serviceWorkerRegistration: boolean;
  }>({
    notificationsSupported: false,
    serviceWorkerSupported: false,
    pushManagerSupported: false,
    serviceWorkerRegistration: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prüfe, ob Push-Benachrichtigungen unterstützt werden
    const checkSupport = async () => {
      const notificationsSupported = 'Notification' in window;
      const serviceWorkerSupported = 'serviceWorker' in navigator;
      const pushManagerSupported = 'PushManager' in window;
      
      setDebugInfo({
        notificationsSupported,
        serviceWorkerSupported,
        pushManagerSupported,
        serviceWorkerRegistration: false
      });

      if (notificationsSupported && serviceWorkerSupported && pushManagerSupported) {
        setIsSupported(true);
        setPermission(Notification.permission);
        
        try {
          // Registriere den Service Worker
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registriert:', registration);
          
          // Warte, bis der Service Worker aktiv ist
          await navigator.serviceWorker.ready;
          console.log('Service Worker ist bereit');
          
          setDebugInfo(prev => ({ ...prev, serviceWorkerRegistration: true }));
          setServiceWorkerStatus('active');
          
          const existingSubscription = await registration.pushManager.getSubscription();
          setSubscription(existingSubscription);
          setIsEnabled(!!existingSubscription);
        } catch (error) {
          console.error('Service Worker Fehler:', error);
          setServiceWorkerStatus('error');
        }
      }
    };

    checkSupport();
  }, []);

  const handleSubscribe = async () => {
    if (isLoading || !isSupported || !isEnabled) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Subscribing to push notifications...');
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      console.log('Subscription created:', subscription);

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      setSubscription(subscription);
      setIsEnabled(true);
      console.log('Push notifications enabled');

      // Sende eine Test-Benachrichtigung
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
        console.log('Unsubscribing from push notifications...');
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
        console.log('Push notifications disabled');
      }
    } catch (error) {
      console.error('Fehler beim Abbestellen:', error);
      setError('Fehler beim Abbestellen der Push-Benachrichtigungen');
    } finally {
      setIsLoading(false);
    }
  };

  // Aktualisiere den Status, wenn sich die Berechtigung ändert
  useEffect(() => {
    if (permission === 'granted' && !isEnabled) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription(existingSubscription);
          setIsEnabled(true);
        }
      });
    }
  }, [permission, isEnabled]);

  if (!isSupported) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-[#460b6c]/30 rounded-lg hover:bg-[#460b6c]/40 transition-colors">
          <div className="flex flex-col">
            <span className="text-[#ff9900] font-medium">Push-Benachrichtigungen</span>
            <span className="text-[#ff9900]/60 text-sm">Erhalte Updates über neue Nachrichten</span>
          </div>
          <span className="text-[#ff9900]/60 text-sm">Nicht unterstützt</span>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 text-red-200 rounded-lg">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-[#460b6c]/30 rounded-lg hover:bg-[#460b6c]/40 transition-colors">
        <div className="flex flex-col">
          <span className="text-[#ff9900] font-medium">Push-Benachrichtigungen</span>
          <span className="text-[#ff9900]/60 text-sm">Erhalte Updates über neue Nachrichten</span>
        </div>
        {!isSupported ? (
          <span className="text-[#ff9900]/60 text-sm">Nicht unterstützt</span>
        ) : !isEnabled ? (
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="px-4 py-2 bg-[#ff9900] text-[#460b6c] rounded-lg font-medium hover:bg-[#ff9900]/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Wird aktiviert...' : 'Aktivieren'}
          </button>
        ) : (
          <button
            onClick={handleUnsubscribe}
            disabled={isLoading}
            className="px-4 py-2 bg-[#460b6c] text-[#ff9900] rounded-lg font-medium hover:bg-[#460b6c]/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Wird deaktiviert...' : 'Deaktivieren'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {isEnabled && (
        <div className="p-4 bg-[#460b6c]/20 text-[#ff9900] rounded-lg">
          <p className="text-sm">Du erhältst jetzt Push-Benachrichtigungen für neue Nachrichten.</p>
        </div>
      )}
    </div>
  );
} 