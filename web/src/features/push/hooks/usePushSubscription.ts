import { useState, useEffect, useCallback } from 'react';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { checkSubscription } from '../actions/checkSubscription';
import { subscribePushAction } from '../actions/subscribePush';
import { unsubscribePushAction } from '../actions/unsubscribePush';
import { env } from 'next-runtime-env';
import { toast } from 'react-hot-toast';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

const VAPID_PUBLIC_KEY = env('NEXT_PUBLIC_VAPID_PUBLIC_KEY');

interface UsePushSubscriptionReturn {
  isSubscribed: boolean;
  isLoading: boolean;
  isSupported: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  autoActivateIfPermissionGranted: () => Promise<void>;
}

// Helper-Funktionen für Push-State-Tracking sind hier entfernt da nicht mehr benötigt

// Nur die benötigten Helper-Funktionen für manuelle Deaktivierung
const setPushManuallyDisabled = (deviceId: string) => {
  localStorage.setItem(`push-manually-disabled-${deviceId}`, 'true');
  localStorage.setItem(`push-manually-disabled-timestamp-${deviceId}`, Date.now().toString());
};

const isPushManuallyDisabled = (deviceId: string): boolean => {
  return localStorage.getItem(`push-manually-disabled-${deviceId}`) === 'true';
};

const clearPushManuallyDisabled = (deviceId: string) => {
  localStorage.removeItem(`push-manually-disabled-${deviceId}`);
  localStorage.removeItem(`push-manually-disabled-timestamp-${deviceId}`);
};

export function usePushSubscription(): UsePushSubscriptionReturn {
  const deviceId = useDeviceId();
  const { isOnline, forceHealthCheck } = useNetworkStatus();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Browser-Support prüfen
  const isSupported = typeof window !== 'undefined' && 
    'Notification' in window && 
    'serviceWorker' in navigator && 
    'PushManager' in window &&
    !!VAPID_PUBLIC_KEY;

  // Automatische Push-Aktivierung wenn Permission bereits vorhanden
  const autoActivateIfPermissionGranted = useCallback(async () => {
    if (!deviceId || !isSupported || isSubscribed) {
      return;
    }

    try {
      // Prüfe Browser-Permission - wenn bereits granted, prüfe weitere Bedingungen
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        console.log('[usePushSubscription] Browser-Permission bereits gewährt - prüfe Aktivierungsbedingungen');
        
        // Prüfe ob Push manuell deaktiviert wurde
        const wasManuallyDisabled = isPushManuallyDisabled(deviceId);
        
        console.log('[usePushSubscription] Push-Status-Check:', {
          wasManuallyDisabled
        });
        
        // Normale App-Nutzung - nur aktivieren wenn nie manuell deaktiviert
        if (!wasManuallyDisabled) {
          console.log('[usePushSubscription] Browser-Permission bereits gewährt und nie manuell deaktiviert - aktiviere automatisch');
          await activatePushSubscription();
        } else {
          console.log('[usePushSubscription] Browser-Permission gewährt, aber manuell deaktiviert - keine automatische Aktivierung');
        }
        
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        // Berechtigung noch nicht angefragt - prüfe ob erster App-Start
        const hasAskedBefore = localStorage.getItem(`push-asked-before-${deviceId}`);
        
        if (!hasAskedBefore) {
          // Erster App-Start - frage direkt!
          console.log('[usePushSubscription] Erster App-Start erkannt - trigger Push-Prompt');
          
          window.dispatchEvent(new CustomEvent('triggerPushPrompt', {
            detail: { reason: 'first-start' }
          }));
          
          // Markiere als "schon mal gefragt"
          localStorage.setItem(`push-asked-before-${deviceId}`, 'true');
        }
      }
    } catch (error) {
      console.error('[usePushSubscription] Fehler bei automatischer Aktivierung:', error);
    }
  }, [deviceId, isSupported, isSubscribed]);

  // Hilfsfunktion für Push-Aktivierung
  const activatePushSubscription = async () => {
    const registration = await navigator.serviceWorker.ready;
    let pushSubscription = await registration.pushManager.getSubscription();
    
    // Falls keine Browser-Subscription existiert, erstelle eine
    if (!pushSubscription) {
      pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });
      console.log('[usePushSubscription] Neue Browser-Subscription erstellt');
    }
    
    // Prüfe Server-Status
    const { exists } = await checkSubscription(deviceId!);
    
    if (!exists) {
      // Server hat keine Subscription - erstelle eine
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
        deviceId: deviceId!
      });

      if (result.status === 'success') {
        setIsSubscribed(true);
        // Manuelle Deaktivierung zurücksetzen, da jetzt aktiv
        clearPushManuallyDisabled(deviceId!);
        console.log('[usePushSubscription] Push-Benachrichtigungen automatisch aktiviert');
        // Toast entfernt - wird von anderen Komponenten gehandhabt
      } else {
        console.warn('[usePushSubscription] Fehler beim automatischen Aktivieren:', result.message);
      }
    } else {
      setIsSubscribed(true);
      // Manuelle Deaktivierung zurücksetzen, da jetzt aktiv
      clearPushManuallyDisabled(deviceId!);
      console.log('[usePushSubscription] Push-Subscription bereits auf Server vorhanden');
    }
  };

  // Einfache Status-Prüfung
  const checkStatus = useCallback(async () => {
    if (!deviceId || !isSupported) {
      setIsLoading(false);
      return;
    }

    // Wenn offline, keinen Server-Check machen und keinen Fehler setzen
    if (!isOnline) {
      setIsLoading(false);
      setError(null); // Explizit Error clearen bei Offline
      return;
    }

    try {
      // 1. Browser-Permission prüfen
      if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
        setIsSubscribed(false);
        setIsLoading(false);
        setError(null);
        
        // Nach kurzer Verzögerung automatische Aktivierung versuchen
        setTimeout(autoActivateIfPermissionGranted, 500);
        return;
      }

      // 2. Browser-Subscription prüfen
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (!pushSubscription) {
        setIsSubscribed(false);
        setIsLoading(false);
        setError(null);
        
        // Nach kurzer Verzögerung automatische Aktivierung versuchen
        setTimeout(autoActivateIfPermissionGranted, 500);
        return;
      }

      // 3. Server-Status prüfen (nur wenn online)
      const { exists } = await checkSubscription(deviceId);
      setIsSubscribed(exists);
      setError(null); // Error clearen bei erfolgreichem Check
      
      // Cleanup: Wenn Server sagt "nein", Browser-Subscription entfernen
      if (!exists) {
        await pushSubscription.unsubscribe();
        setIsSubscribed(false);
        
        // Nach kurzer Verzögerung automatische Aktivierung versuchen
        setTimeout(autoActivateIfPermissionGranted, 500);
      }
    } catch (error) {
      console.error('[usePushSubscription] Fehler beim Status-Check:', error);
      
      // Server-Connectivity prüfen statt direkt Error zu setzen
      await forceHealthCheck();
      
      // Nur bei wiederholten Online-Fehlern Toast zeigen
      if (isOnline) {
        console.warn('[usePushSubscription] Server-Fehler bei Push-Status-Check');
        // Keine Error setzen, sondern nur loggen - Toast nur bei kritischen Problemen
      } else {
        console.log('[usePushSubscription] Server nicht erreichbar - kein Fehler');
      }
      setError(null); // Nie Error setzen - stattdessen stumme Behandlung
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, isSupported, isOnline, autoActivateIfPermissionGranted, forceHealthCheck]);

  // Subscribe function
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!deviceId || !isSupported) {
      toast.error('Push-Benachrichtigungen werden auf diesem Gerät nicht unterstützt');
      return false;
    }

    // Prüfe Offline-Status
    if (!isOnline) {
      toast.error('Push-Benachrichtigungen können im Offline-Modus nicht aktiviert werden');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if Notification API is available
      if (typeof window === 'undefined' || !('Notification' in window)) {
        toast.error('Push-Benachrichtigungen werden auf diesem Gerät nicht unterstützt');
        return false;
      }

      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast.error('Push-Benachrichtigungen wurden nicht erlaubt');
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
        // 🚨 WICHTIG: Manuelle Deaktivierung zurücksetzen bei erfolgreicher Aktivierung
        clearPushManuallyDisabled(deviceId);
        console.log('[usePushSubscription] Push-Benachrichtigungen manuell aktiviert - disable-Flag zurückgesetzt');
        toast.success('Push-Benachrichtigungen aktiviert! 🔔');
        return true;
      } else {
        throw new Error(result.message || 'Fehler beim Speichern der Subscription');
      }
    } catch (error) {
      console.error('[usePushSubscription] Fehler beim Abonnieren:', error);
      
      // Server-Connectivity prüfen
      await forceHealthCheck();
      
      // Bessere Fehlermeldungen basierend auf Online-Status
      if (!isOnline) {
        toast.error('Server nicht erreichbar - Push-Benachrichtigungen können nicht aktiviert werden');
      } else {
        toast.error('Fehler beim Aktivieren der Push-Benachrichtigungen');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, isSupported, isOnline, forceHealthCheck]);

  // Unsubscribe function
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!deviceId || !isSupported) {
      return false;
    }

    // Bei Offline kann lokale Subscription trotzdem entfernt werden
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        
        // Server-Benachrichtigung nur bei Online-Status
        if (isOnline) {
          await unsubscribePushAction(pushSubscription.endpoint);
          toast.success('Push-Benachrichtigungen deaktiviert');
        } else {
          toast.success('Push-Benachrichtigungen lokal deaktiviert (Server wird später benachrichtigt)');
        }
      }

      setIsSubscribed(false);
      
      // 🚨 WICHTIG: Markiere als manuell deaktiviert für zukünftige automatische Aktivierungsversuche
      setPushManuallyDisabled(deviceId);
      console.log('[usePushSubscription] Push-Benachrichtigungen manuell deaktiviert - disable-Flag gesetzt');
      
      return true;
    } catch (error) {
      console.error('[usePushSubscription] Fehler beim Abbestellen:', error);
      
      // Bei Offline weniger kritisch
      if (!isOnline) {
        setIsSubscribed(false); // Lokal trotzdem als deaktiviert markieren
        // Auch bei Offline-Deaktivierung als manuell markieren
        setPushManuallyDisabled(deviceId);
        console.log('[usePushSubscription] Push-Benachrichtigungen offline deaktiviert - disable-Flag gesetzt');
        toast.success('Push-Benachrichtigungen lokal deaktiviert');
        return true; // Als Erfolg werten, da lokale Deaktivierung funktioniert hat
      } else {
        toast.error('Fehler beim Deaktivieren der Push-Benachrichtigungen');
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, isSupported, isOnline]);

  // Initial check
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Status neu prüfen wenn Online-Status sich ändert
  useEffect(() => {
    if (isOnline) {
      console.log('[usePushSubscription] Online-Status wiederhergestellt - prüfe Push-Status neu');
      checkStatus();
    }
  }, [isOnline, checkStatus]);

  return {
    isSubscribed,
    isLoading,
    isSupported,
    error,
    subscribe,
    unsubscribe,
    refreshStatus: checkStatus,
    autoActivateIfPermissionGranted
  };
} 