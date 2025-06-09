import { useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { checkSubscription } from '../actions/checkSubscription';
import { subscribePushAction } from '../actions/subscribePush';
import { unsubscribePushAction } from '../actions/unsubscribePush';
import { env } from 'next-runtime-env';
import { toast } from 'react-hot-toast';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { AuthContext, AuthContextType } from '@/features/auth/AuthContext';
import { PushStateManager } from '../utils/pushStateManager';

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
    'PushManager' in window &&
    Notification !== undefined;

  // Initialisiere PushStateManager
  useEffect(() => {
    if (isClient) {
      PushStateManager.init();
    }
  }, [isClient]);

  // Cleanup alte User-Daten wenn User sich ändert
  useEffect(() => {
    if (user?.id) {
      PushStateManager.cleanupUserData(user.id);
    }
  }, [user?.id]);

  // Check subscription status
  const refreshStatus = useCallback(async () => {
    if (!isSupported || !isClient) {
      setIsUserSubscribed(false);
      setIsGeneralSubscribed(false);
      return;
    }

    try {
      const state = await PushStateManager.getCurrentState();
      setIsUserSubscribed(state.isUserSubscribed);
      setIsGeneralSubscribed(state.hasSubscription);
    } catch (error) {
      console.error('[usePushSubscription] Fehler beim Status-Check:', error);
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
    if (!isClient || !isSupported || isUserSubscribed || isGeneralSubscribed) return;

    const checkInitialPermission = async () => {
      try {
        await refreshStatus();
      } catch (error) {
        console.error('[usePushSubscription] Fehler bei initialer Berechtigungsabfrage:', error);
      }
    };

    checkInitialPermission();
  }, [isSupported, isUserSubscribed, isGeneralSubscribed, isClient, user, refreshStatus]);

  // Auto-activate if permission is granted
  const autoActivateIfPermissionGranted = useCallback(async () => {
    if (!isClient || !isSupported || isUserSubscribed || isGeneralSubscribed) {
      return;
    }

    try {
      if (Notification?.permission === 'granted') {
        console.log('[usePushSubscription] Berechtigung bereits vorhanden - aktiviere automatisch');
        await PushStateManager.subscribe(user?.id);
        await refreshStatus();
      }
    } catch (error) {
      console.error('[usePushSubscription] Fehler bei automatischer Aktivierung:', error);
    }
  }, [user, isSupported, isUserSubscribed, isGeneralSubscribed, isClient, refreshStatus]);

  // Subscribe
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isClient || !isSupported) {
      toast.error('Push-Benachrichtigungen werden auf diesem Gerät nicht unterstützt');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      PushStateManager.markPrompted();
      
      if (permission !== 'granted') {
        toast.error('Push-Benachrichtigungen wurden nicht erlaubt');
        return false;
      }

      if (!isOnline) {
        PushStateManager.setOfflineAction('subscribe');
        toast.success('Push-Benachrichtigungen werden aktiviert sobald online');
        return true;
      }

      await PushStateManager.subscribe(user?.id);
      await refreshStatus();
      
      toast.success('Push-Benachrichtigungen aktiviert! 🔔');
      return true;
    } catch (error) {
      console.error('[usePushSubscription] Fehler beim Aktivieren:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error(`Fehler: ${errorMessage}`);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, isOnline, isClient, refreshStatus]);

  // Unsubscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isClient || !isSupported) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!isOnline) {
        PushStateManager.setOfflineAction('unsubscribe');
        toast.success('Push-Benachrichtigungen werden deaktiviert sobald online');
        return true;
      }

      await PushStateManager.unsubscribe(user?.id);
      await refreshStatus();
      
      toast.success('Push-Benachrichtigungen deaktiviert');
      return true;
    } catch (error) {
      console.error('[usePushSubscription] Fehler beim Deaktivieren:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error(`Fehler: ${errorMessage}`);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, isOnline, isClient, refreshStatus]);

  // Process offline actions when coming online
  useEffect(() => {
    if (!isOnline || !isSupported || isLoading) return;

    const processOfflineActions = async () => {
      const action = PushStateManager.getOfflineAction();
      if (!action) return;

      setIsLoading(true);
      try {
        if (action.type === 'subscribe') {
          await PushStateManager.subscribe(user?.id);
        } else {
          await PushStateManager.unsubscribe(user?.id);
        }
        PushStateManager.clearOfflineAction();
        await refreshStatus();
      } catch (error) {
        console.error('[usePushSubscription] Fehler bei Offline-Aktion:', error);
      } finally {
        setIsLoading(false);
      }
    };

    processOfflineActions();
  }, [isOnline, isSupported, isLoading, user, refreshStatus]);

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