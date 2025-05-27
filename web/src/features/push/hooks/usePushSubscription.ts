import { useState, useEffect, useCallback } from 'react';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { checkSubscription } from '../actions/checkSubscription';
import { subscribePushAction } from '../actions/subscribePush';
import { unsubscribePushAction } from '../actions/unsubscribePush';
import { env } from 'next-runtime-env';

const VAPID_PUBLIC_KEY = env('NEXT_PUBLIC_VAPID_PUBLIC_KEY');

interface UsePushSubscriptionReturn {
  isSubscribed: boolean;
  isLoading: boolean;
  isSupported: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

export function usePushSubscription(): UsePushSubscriptionReturn {
  const deviceId = useDeviceId();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Browser-Support prüfen
  const isSupported = typeof window !== 'undefined' && 
    'Notification' in window && 
    'serviceWorker' in navigator && 
    'PushManager' in window;

  // Einfache Status-Prüfung
  const checkStatus = useCallback(async () => {
    if (!deviceId || !isSupported) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Browser-Permission prüfen
      if (Notification.permission !== 'granted') {
        setIsSubscribed(false);
        setIsLoading(false);
        return;
      }

      // 2. Browser-Subscription prüfen
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (!pushSubscription) {
        setIsSubscribed(false);
        setIsLoading(false);
        return;
      }

      // 3. Server-Status prüfen
      const { exists } = await checkSubscription(deviceId);
      setIsSubscribed(exists);
      
      // Cleanup: Wenn Server sagt "nein", Browser-Subscription entfernen
      if (!exists) {
        await pushSubscription.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('[usePushSubscription] Fehler beim Status-Check:', error);
      setError('Fehler beim Prüfen des Push-Status');
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, isSupported]);

  // Subscribe function
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!deviceId || !isSupported) {
      setError('Push-Benachrichtigungen werden nicht unterstützt');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setError('Push-Benachrichtigungen wurden nicht erlaubt');
        return false;
      }

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

      const result = await subscribePushAction({
        endpoint: pushSubscription.endpoint,
        keys: { p256dh, auth },
        deviceId
      });

      if (result.status === 'success') {
        setIsSubscribed(true);
        return true;
      } else {
        throw new Error(result.message || 'Fehler beim Speichern der Subscription');
      }
    } catch (error) {
      console.error('[usePushSubscription] Fehler beim Abonnieren:', error);
      setError('Fehler beim Aktivieren der Push-Benachrichtigungen');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, isSupported]);

  // Unsubscribe function
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!deviceId || !isSupported) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        await unsubscribePushAction(pushSubscription.endpoint);
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('[usePushSubscription] Fehler beim Abbestellen:', error);
      setError('Fehler beim Deaktivieren der Push-Benachrichtigungen');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, isSupported]);

  // Initial check
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    isSubscribed,
    isLoading,
    isSupported,
    error,
    subscribe,
    unsubscribe,
    refreshStatus: checkStatus
  };
} 