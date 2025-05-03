'use client';

import { useState, useEffect } from 'react';
import { webPushClient } from '@/client/lib/webpush';

interface DebugInfo {
  supported: boolean;
  permission: string;
  subscription: string;
  vapidKey: string;
}

export default function PushNotificationSettings() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    supported: false,
    permission: 'unbekannt',
    subscription: 'unbekannt',
    vapidKey: webPushClient.getPublicKey() || 'Nicht gesetzt'
  });

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setDebugInfo(prev => ({ ...prev, supported: false }));
        setIsLoading(false);
        return;
      }

      setDebugInfo(prev => ({ ...prev, supported: true }));

      const permission = await navigator.permissions.query({ name: 'notifications' });
      setDebugInfo(prev => ({ ...prev, permission: permission.state }));

      const subscription = await webPushClient.getSubscription();
      
      setDebugInfo(prev => ({ 
        ...prev, 
        subscription: subscription ? 'Aktiv' : 'Nicht aktiv'
      }));
      
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Fehler beim Prüfen des Subscription-Status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    try {
      setIsLoading(true);
      await webPushClient.subscribe();
      setIsSubscribed(true);
      setDebugInfo(prev => ({ ...prev, subscription: 'Aktiv' }));
    } catch (error) {
      console.error('Fehler beim Abonnieren:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      setIsLoading(true);
      await webPushClient.unsubscribe();
      setIsSubscribed(false);
      setDebugInfo(prev => ({ ...prev, subscription: 'Nicht aktiv' }));
    } catch (error) {
      console.error('Fehler beim Abbestellen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Lade...</div>;
  }

  if (!debugInfo.supported) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Push-Benachrichtigungen</h2>
        <p className="text-red-500">
          Push-Benachrichtigungen werden von Ihrem Browser nicht unterstützt.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Push-Benachrichtigungen</h2>
      
      <div className="mb-4">
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isLoading}
          className={`px-4 py-2 rounded ${
            isSubscribed
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white disabled:opacity-50`}
        >
          {isSubscribed ? 'Abbestellen' : 'Aktivieren'}
        </button>
      </div>

      <div className="mt-4">
        <h3 className="font-bold mb-2">Debug-Informationen</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-2 px-2 sm:px-4 text-[#ff9900]/60">Unterstützt</td>
              <td className="py-2 px-2 sm:px-4">{debugInfo.supported ? 'Ja' : 'Nein'}</td>
            </tr>
            <tr>
              <td className="py-2 px-2 sm:px-4 text-[#ff9900]/60">Berechtigung</td>
              <td className="py-2 px-2 sm:px-4">{debugInfo.permission}</td>
            </tr>
            <tr>
              <td className="py-2 px-2 sm:px-4 text-[#ff9900]/60">Subscription</td>
              <td className="py-2 px-2 sm:px-4">{debugInfo.subscription}</td>
            </tr>
            <tr>
              <td className="py-2 px-2 sm:px-4 text-[#ff9900]/60">VAPID Key</td>
              <td className="py-2 px-2 sm:px-4 truncate max-w-[200px] sm:max-w-xs">{debugInfo.vapidKey}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
