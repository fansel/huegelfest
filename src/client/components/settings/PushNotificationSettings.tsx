import React, { useEffect, useState } from 'react';

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
  serviceWorkerState: string;
  subscription: PushSubscriptionData | null;
}

const PushNotificationSettings: React.FC = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    notificationsSupported: false,
    serviceWorkerSupported: false,
    pushManagerSupported: false,
    serviceWorkerState: 'Nicht unterstützt',
    subscription: null
  });

  useEffect(() => {
    const checkSupport = async () => {
      const notificationsSupported = 'Notification' in window;
      const serviceWorkerSupported = 'serviceWorker' in navigator;
      const pushManagerSupported = 'PushManager' in window;

      setIsSupported(notificationsSupported && serviceWorkerSupported && pushManagerSupported);
      setPermission(Notification.permission);

      if (serviceWorkerSupported) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const pushSubscription = await registration.pushManager.getSubscription();
          
          if (pushSubscription) {
            const subscriptionData: PushSubscriptionData = {
              endpoint: pushSubscription.endpoint,
              keys: {
                p256dh: btoa(String.fromCharCode.apply(null, 
                  new Uint8Array(pushSubscription.getKey('p256dh') || new ArrayBuffer(0)))),
                auth: btoa(String.fromCharCode.apply(null, 
                  new Uint8Array(pushSubscription.getKey('auth') || new ArrayBuffer(0))))
              }
            };
            setSubscription(subscriptionData);
            setIsEnabled(true);
            setDebugInfo(prev => ({
              ...prev,
              subscription: subscriptionData
            }));
          } else {
            setSubscription(null);
            setIsEnabled(false);
            setDebugInfo(prev => ({
              ...prev,
              subscription: null
            }));
          }
        } catch (error) {
          console.error('Fehler beim Prüfen des Subscription-Status:', error);
          setSubscription(null);
          setIsEnabled(false);
          setDebugInfo(prev => ({
            ...prev,
            subscription: null
          }));
        }
      }
      
      setDebugInfo(prev => ({ 
        ...prev, 
        notificationsSupported,
        serviceWorkerSupported,
        pushManagerSupported,
        serviceWorkerState: serviceWorkerSupported ? 'Registriert' : 'Nicht unterstützt'
      }));
      setIsLoading(false);
    };

    checkSupport();

    // Event Listener für Service Worker Updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_SUBSCRIPTION_CHANGE') {
          checkSupport();
        }
      });
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', checkSupport);
      }
    };
  }, []);

  const handleSubscribe = async () => {
    if (!isSupported) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Hole den VAPID Public Key vom Server
      const response = await fetch('/api/push/vapid-key');
      const { publicKey } = await response.json();

      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });

      const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID();
      localStorage.setItem('deviceId', deviceId);

      const subscriptionData: PushSubscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, 
            new Uint8Array(pushSubscription.getKey('p256dh') || new ArrayBuffer(0)))),
          auth: btoa(String.fromCharCode.apply(null, 
            new Uint8Array(pushSubscription.getKey('auth') || new ArrayBuffer(0))))
        }
      };

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...subscriptionData,
          deviceId
        }),
      });

      setSubscription(subscriptionData);
      setIsEnabled(true);
      setDebugInfo(prev => ({
        ...prev,
        subscription: subscriptionData
      }));
    } catch (error) {
      console.error('Fehler beim Aktivieren der Push-Benachrichtigungen:', error);
      setError('Fehler beim Aktivieren der Push-Benachrichtigungen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!isSupported || !subscription) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      const deviceId = localStorage.getItem('deviceId');
      if (deviceId) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deviceId }),
        });
      }

      setSubscription(null);
      setIsEnabled(false);
      setDebugInfo(prev => ({
        ...prev,
        subscription: null
      }));
    } catch (error) {
      console.error('Fehler beim Deaktivieren der Push-Benachrichtigungen:', error);
      setError('Fehler beim Deaktivieren der Push-Benachrichtigungen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!isSupported || !subscription) return;
    
    try {
      await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          deviceId: localStorage.getItem('deviceId')
        }),
      });
    } catch (error) {
      console.error('Fehler beim Senden der Test-Benachrichtigung:', error);
      setError('Fehler beim Senden der Test-Benachrichtigung');
    }
  };

  const handleRestartPush = async () => {
    if (!isSupported) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Service Worker deregistrieren
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }

      // Service Worker neu registrieren
      const newRegistration = await navigator.serviceWorker.register('/sw.js');
      await newRegistration.update();

      // Hole den VAPID Public Key vom Server
      const response = await fetch('/api/push/vapid-key');
      const { publicKey } = await response.json();

      // Neue Subscription erstellen
      const pushSubscription = await newRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });

      const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID();
      localStorage.setItem('deviceId', deviceId);

      const subscriptionData: PushSubscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, 
            new Uint8Array(pushSubscription.getKey('p256dh') || new ArrayBuffer(0)))),
          auth: btoa(String.fromCharCode.apply(null, 
            new Uint8Array(pushSubscription.getKey('auth') || new ArrayBuffer(0))))
        }
      };

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...subscriptionData,
          deviceId
        }),
      });

      setSubscription(subscriptionData);
      setIsEnabled(true);
      setDebugInfo(prev => ({
        ...prev,
        subscription: subscriptionData
      }));

      // Seite neu laden um sicherzustellen, dass alles korrekt initialisiert ist
      window.location.reload();
    } catch (error) {
      console.error('Fehler beim Neustarten der Push-Benachrichtigungen:', error);
      setError('Fehler beim Neustarten der Push-Benachrichtigungen');
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
                <>
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
                  <button
                    onClick={handleRestartPush}
                    className="text-[#ff9900]/60 hover:text-[#ff9900] transition-colors p-2 hover:bg-[#460b6c]/20 rounded-full"
                    title="Push-Benachrichtigungen neustarten"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PushNotificationSettings; 