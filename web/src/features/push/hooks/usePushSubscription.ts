import { useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { subscribePushAction } from '../actions/subscribePush';
import { unsubscribePushAction } from '../actions/unsubscribePush';
import { env } from 'next-runtime-env';
import { toast } from 'react-hot-toast';
import { useServerStatus } from '@/shared/hooks/useServerStatus';
import { AuthContext, AuthContextType } from '@/features/auth/AuthContext';

const VAPID_PUBLIC_KEY = env('NEXT_PUBLIC_VAPID_PUBLIC_KEY');

interface UsePushSubscriptionReturn {
  isSubscribed: boolean;
  isLoading: boolean;
  isSupported: boolean;
  isOnline: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export function usePushSubscription(): UsePushSubscriptionReturn {
  const isClient = typeof window !== 'undefined';
  const { user } = useContext(AuthContext) as AuthContextType;
  const { isBrowserOnline } = useServerStatus();

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isSupported = isClient && 
    'Notification' in window && 
    'serviceWorker' in navigator && 
    'PushManager' in window &&
    Notification !== undefined;

  const getServiceWorkerRegistration = useCallback(async () => {
    if (!isSupported) return null;
    return navigator.serviceWorker.ready;
  }, [isSupported]);
  
  useEffect(() => {
    if (!isSupported) {
      setIsLoading(false);
      return;
    }

    const checkSubscriptionStatus = async () => {
      setIsLoading(true);
      try {
        const registration = await getServiceWorkerRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (e) {
        console.error("Error checking push subscription status:", e);
        setError("Fehler beim Prüfen des Push-Status");
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscriptionStatus();
  }, [isSupported, getServiceWorkerRegistration]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || isSubscribed || !isBrowserOnline) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Push-Benachrichtigungen wurden nicht erlaubt.');
        setIsLoading(false);
        return false;
      }
      
      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        throw new Error("Service Worker nicht bereit.");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });
      
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      
      const subPayload = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: p256dhKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey)))) : '',
          auth: authKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey)))) : ''
        }
      };
      
      const result = await subscribePushAction(subPayload);
      if (result.status !== 'success') {
        throw new Error(result.message || "Server-Fehler beim Abonnieren.");
      }
      
      setIsSubscribed(true);
      toast.success('Push-Benachrichtigungen aktiviert! 🔔');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.';
      console.error('[usePushSubscription] Fehler beim Aktivieren:', err);
      toast.error(`Fehler: ${message}`);
      setError(message);
      
      // Cleanup if subscription was created locally but failed on server
      const registration = await getServiceWorkerRegistration();
      const localSub = await registration?.pushManager.getSubscription();
      await localSub?.unsubscribe();

      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isSubscribed, isBrowserOnline, getServiceWorkerRegistration]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !isSubscribed || !isBrowserOnline) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        toast.success('Push-Benachrichtigungen waren bereits deaktiviert.');
        return true;
      }
      
      const result = await unsubscribePushAction(subscription.endpoint);
      if (result.status !== 'success') {
        throw new Error(result.message || 'Server-Fehler beim De-Abonnieren.');
      }
      
      const unsubscribedSuccessfully = await subscription.unsubscribe();
      if (!unsubscribedSuccessfully) {
        throw new Error("Fehler beim lokalen De-Abonnieren.");
      }
      
      setIsSubscribed(false);
      toast.success('Push-Benachrichtigungen deaktiviert.');
      return true;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.';
      console.error('[usePushSubscription] Fehler beim Deaktivieren:', err);
      toast.error(`Fehler: ${message}`);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, isSubscribed, isBrowserOnline, getServiceWorkerRegistration]);

  return { 
    isSubscribed, 
    isLoading, 
    isSupported, 
    isOnline: isBrowserOnline,
    error,
    subscribe, 
    unsubscribe 
  };
} 