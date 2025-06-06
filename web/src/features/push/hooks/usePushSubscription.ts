import { useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { checkSubscription } from '../actions/checkSubscription';
import { subscribePushAction } from '../actions/subscribePush';
import { unsubscribePushAction } from '../actions/unsubscribePush';
import { env } from 'next-runtime-env';
import { toast } from 'react-hot-toast';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { AuthContext, AuthContextType } from '@/features/auth/AuthContext';

const VAPID_PUBLIC_KEY = env('NEXT_PUBLIC_VAPID_PUBLIC_KEY');
const DEBUG = false;

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

// Helper-Funktionen für Push-State-Tracking (user-based)
const setPushManuallyDisabled = (userId: string) => {
  localStorage.setItem(`push-manually-disabled-${userId}`, 'true');
  localStorage.setItem(`push-manually-disabled-timestamp-${userId}`, Date.now().toString());
};

const isPushManuallyDisabled = (userId: string): boolean => {
  return localStorage.getItem(`push-manually-disabled-${userId}`) === 'true';
};

const clearPushManuallyDisabled = (userId: string) => {
  localStorage.removeItem(`push-manually-disabled-${userId}`);
  localStorage.removeItem(`push-manually-disabled-timestamp-${userId}`);
};

// Hilfsfunktion zum Prüfen ob Push-Berechtigung bereits angefragt wurde
const hasAskedForPermission = (): boolean => {
  return localStorage.getItem('push-permission-asked') === 'true';
};

// Hilfsfunktion zum Markieren dass Push-Berechtigung angefragt wurde
const markPermissionAsked = () => {
  localStorage.setItem('push-permission-asked', 'true');
};

// Queue für ausstehende Änderungen
interface PendingChange {
  type: 'subscribe' | 'unsubscribe';
  endpoint: string;
  keys?: any;
  timestamp: number;
}

const PENDING_CHANGES_KEY = 'push-pending-changes';

// Hilfsfunktionen für Pending Changes
const getPendingChanges = (): PendingChange[] => {
  const stored = localStorage.getItem(PENDING_CHANGES_KEY);
  return stored ? JSON.parse(stored) : [];
};

const addPendingChange = (change: PendingChange) => {
  const changes = getPendingChanges();
  changes.push(change);
  localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
};

const removePendingChange = (endpoint: string) => {
  const changes = getPendingChanges().filter(c => c.endpoint !== endpoint);
  localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
};

export function usePushSubscription(): UsePushSubscriptionReturn {
  // Sicherheitsprüfung für SSR
  const isClient = typeof window !== 'undefined';
  const auth = useContext(AuthContext) as AuthContextType | undefined;
  const user = auth?.user;
  const isOnline = useNetworkStatus();
  const [isUserSubscribed, setIsUserSubscribed] = useState(false);
  const [isGeneralSubscribed, setIsGeneralSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = isClient && 
    'Notification' in window && 
    'serviceWorker' in navigator && 
    'PushManager' in window;

  // Check subscription status
  const refreshStatus = useCallback(async () => {
    if (!isSupported || !isClient) {
      setIsUserSubscribed(false);
      setIsGeneralSubscribed(false);
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      const endpoint = pushSubscription?.endpoint;
      const { userExists, generalExists } = await checkSubscription(endpoint);
      setIsUserSubscribed(userExists);
      setIsGeneralSubscribed(generalExists);
    } catch (error) {
      setIsUserSubscribed(false);
      setIsGeneralSubscribed(false);
    }
  }, [isSupported, isClient]);

  // Load initial subscription status
  useEffect(() => {
    if (!isClient) return;
    refreshStatus();
  }, [refreshStatus, isClient]);

  // Prüfe beim ersten App-Start ob Berechtigung angefragt werden soll
  useEffect(() => {
    if (!isClient || !user || !isSupported || isUserSubscribed || isGeneralSubscribed) return;

    const checkInitialPermission = async () => {
      // Nur wenn noch nie gefragt wurde
      if (!hasAskedForPermission() && Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          markPermissionAsked();
          
          if (permission === 'granted') {
            await activatePushSubscription();
          }
        } catch (error) {
          console.error('[usePushSubscription] Fehler bei initialer Berechtigungsabfrage:', error);
        }
      }
    };

    checkInitialPermission();
  }, [user, isSupported, isUserSubscribed, isGeneralSubscribed, isClient]);

  // Auto-activate if permission is granted
  const autoActivateIfPermissionGranted = useCallback(async () => {
    if (!isClient || !user || !isSupported || isUserSubscribed || isGeneralSubscribed) {
      return;
    }

    try {
      // Prüfe ob Push manuell deaktiviert wurde
      if (isPushManuallyDisabled(user.id)) {
        console.log('[usePushSubscription] Push-Benachrichtigungen wurden manuell deaktiviert - überspringe Auto-Aktivierung');
        return;
      }

      if (Notification.permission === 'granted') {
        console.log('[usePushSubscription] Berechtigung bereits vorhanden - aktiviere automatisch');
        await activatePushSubscription();
      }
    } catch (error) {
      console.error('[usePushSubscription] Fehler bei automatischer Aktivierung:', error);
    }
  }, [user, isSupported, isUserSubscribed, isGeneralSubscribed, isClient]);

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
    const { userExists, generalExists } = await checkSubscription();
    
    if (!userExists) {
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
        keys: { p256dh, auth }
      });

      if (result.status === 'success') {
        setIsUserSubscribed(true);
        // Manuelle Deaktivierung zurücksetzen, da jetzt aktiv
        clearPushManuallyDisabled(user!.id);
        console.log('[usePushSubscription] Push-Benachrichtigungen automatisch aktiviert');
      } else {
        console.warn('[usePushSubscription] Fehler beim automatischen Aktivieren:', result.message);
      }
    } else {
      setIsUserSubscribed(true);
      // Manuelle Deaktivierung zurücksetzen, da jetzt aktiv
      clearPushManuallyDisabled(user!.id);
      console.log('[usePushSubscription] Push-Subscription bereits auf Server vorhanden');
    }
  };

  // Auto-activate on permission change
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Listen for permission changes
      const checkPermission = () => {
        if (Notification.permission === 'granted' && user && !isPushManuallyDisabled(user.id)) {
          autoActivateIfPermissionGranted();
        }
      };

      // Check immediately
      checkPermission();

      // Listen for permission changes (some browsers support this)
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'notifications' as PermissionName }).then(permission => {
          permission.addEventListener('change', checkPermission);
          return () => permission.removeEventListener('change', checkPermission);
        }).catch(() => {
          // Fallback for browsers that don't support permission queries
        });
      }
    }
  }, [user, autoActivateIfPermissionGranted]);

  // Verarbeite ausstehende Änderungen wenn online
  useEffect(() => {
    if (!isOnline || !isSupported || isLoading) return;

    const processPendingChanges = async () => {
      const changes = getPendingChanges();
      if (changes.length === 0) return;

      setIsLoading(true);
      
      for (const change of changes) {
        try {
          if (change.type === 'subscribe' && change.keys) {
            await subscribePushAction({
              endpoint: change.endpoint,
              keys: change.keys
            });
            console.info('[Push] Ausstehende Subscription verarbeitet', { endpoint: change.endpoint });
          } else if (change.type === 'unsubscribe') {
            await unsubscribePushAction(change.endpoint);
            console.info('[Push] Ausstehende Unsubscription verarbeitet', { endpoint: change.endpoint });
          }
          removePendingChange(change.endpoint);
        } catch (error) {
          console.error('[Push] Fehler bei Verarbeitung ausstehender Änderung:', error);
          // Behalte Änderung in Queue wenn älter als 7 Tage
          if (Date.now() - change.timestamp < 7 * 24 * 60 * 60 * 1000) {
            continue;
          }
          removePendingChange(change.endpoint);
        }
      }
      
      setIsLoading(false);
      refreshStatus();
    };

    processPendingChanges();
  }, [isOnline, isSupported, isLoading]);

  // Erweiterte subscribe Funktion
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isClient || !isSupported) {
      toast.error('Push-Benachrichtigungen werden auf diesem Gerät nicht unterstützt');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
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

      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: { p256dh, auth }
      };

      if (!isOnline) {
        // Offline: Speichere für spätere Verarbeitung
        addPendingChange({
          type: 'subscribe',
          ...subscriptionData,
          timestamp: Date.now()
        });
        setIsUserSubscribed(true);
        setIsGeneralSubscribed(true);
        toast.success('Push-Benachrichtigungen aktiviert (wird synchronisiert wenn online)');
        return true;
      }

      try {
        const result = await subscribePushAction(subscriptionData);

        if (result.status === 'success') {
          setIsUserSubscribed(true);
          setIsGeneralSubscribed(true);
          // Nur für eingeloggte User den Push-Status zurücksetzen
          if (user?.id) {
            clearPushManuallyDisabled(user.id);
          }
          toast.success('Push-Benachrichtigungen aktiviert! 🔔');
          return true;
        } else {
          throw new Error(result.message || 'Fehler beim Speichern der Subscription');
        }
      } catch (error) {
        // Wenn Server-Fehler wegen fehlendem User, trotzdem Browser-Subscription aktivieren
        if (error instanceof Error && error.message.includes('userId')) {
          setIsUserSubscribed(false);
          setIsGeneralSubscribed(true);
          toast.success('Push-Benachrichtigungen aktiviert! 🔔');
          return true;
        }
        throw error;
      }
    } catch (error) {
      console.error('[usePushSubscription] Fehler beim Abonnieren:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      // Ignoriere userId-bezogene Fehler für anonyme User
      if (errorMessage.includes('userId')) {
        setIsUserSubscribed(false);
        setIsGeneralSubscribed(true);
        toast.success('Push-Benachrichtigungen aktiviert! 🔔');
        return true;
      }
      toast.error(`Fehler: ${errorMessage}`);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, isOnline, isClient]);

  // Erweiterte unsubscribe Funktion
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isClient || !isSupported) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        // Erst Server-Subscription entfernen, dann Browser-Subscription
        if (!isOnline) {
          // Offline: Speichere für spätere Verarbeitung
          addPendingChange({
            type: 'unsubscribe',
            endpoint: pushSubscription.endpoint,
            timestamp: Date.now()
          });
          // NICHT die Browser-Subscription entfernen
          setIsUserSubscribed(false);
          setIsGeneralSubscribed(true); // Behalte die generelle Subscription
          // Nur für eingeloggte User den Push-Status speichern
          if (user?.id) {
            setPushManuallyDisabled(user.id);
          }
          toast.success('Push-Benachrichtigungen für User deaktiviert (wird synchronisiert wenn online)');
          return true;
        }

        try {
          // Wenn User eingeloggt ist, nur die User-Verknüpfung entfernen
          if (user?.id) {
            await unsubscribePushAction(pushSubscription.endpoint, user.id);
            setIsUserSubscribed(false);
            setIsGeneralSubscribed(true); // Behalte die generelle Subscription
            setPushManuallyDisabled(user.id);
            toast.success('Push-Benachrichtigungen für User deaktiviert');
          } else {
            // Für anonyme User die komplette Subscription entfernen
            await unsubscribePushAction(pushSubscription.endpoint);
            await pushSubscription.unsubscribe();
            setIsUserSubscribed(false);
            setIsGeneralSubscribed(false);
          }
          return true;
        } catch (error) {
          // Wenn Server-Fehler, aber Browser-Unsubscribe erfolgreich war
          if (error instanceof Error && 
              (error.message.includes('Subscription not found') || 
               error.message.includes('userId'))) {
            // Nur Status aktualisieren
            setIsUserSubscribed(false);
            if (!user?.id) {
              setIsGeneralSubscribed(false);
            } else {
              setIsGeneralSubscribed(true); // Behalte für eingeloggte User
            }
            if (user?.id) {
              setPushManuallyDisabled(user.id);
            }
            toast.success('Push-Benachrichtigungen angepasst');
            return true;
          }
          throw error;
        }
      }
      // Keine aktive Subscription vorhanden
      setIsUserSubscribed(false);
      setIsGeneralSubscribed(false);
      if (user?.id) {
        setPushManuallyDisabled(user.id);
      }
      return true;
    } catch (error) {
      console.error('[usePushSubscription] Fehler beim Abbestellen:', error);
      if (!isOnline) {
        setIsUserSubscribed(false);
        setIsGeneralSubscribed(true); // Behalte die generelle Subscription
        if (user?.id) {
          setPushManuallyDisabled(user.id);
        }
        toast.success('Push-Benachrichtigungen für User lokal deaktiviert');
        return true;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler';
      // Ignoriere userId-bezogene Fehler
      if (errorMsg.includes('userId')) {
        setIsUserSubscribed(false);
        setIsGeneralSubscribed(true); // Behalte die generelle Subscription
        toast.success('Push-Benachrichtigungen für User deaktiviert');
        return true;
      }
      setError(errorMsg);
      toast.error(`Fehler beim Deaktivieren: ${errorMsg}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, isOnline, isClient]);

  // Refresh status when user changes
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    isSubscribed: isUserSubscribed || isGeneralSubscribed,
    isLoading,
    isSupported,
    error,
    subscribe,
    unsubscribe,
    refreshStatus,
    autoActivateIfPermissionGranted
  };
} 