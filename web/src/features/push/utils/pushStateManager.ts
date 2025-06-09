import { env } from 'next-runtime-env';

const PUSH_STATE_KEY = 'push-state';
const VAPID_PUBLIC_KEY = env('NEXT_PUBLIC_VAPID_PUBLIC_KEY');

interface PushSubscriptionData {
  endpoint: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
  userIds: string[];
}

interface PushState {
  hasBeenPrompted: boolean;
  wantsPush: boolean; // Ob der User Push grundsätzlich will (unabhängig von Browser-Permission)
  subscription: PushSubscriptionData | null;
  offlineAction?: {
    type: 'subscribe' | 'unsubscribe';
    timestamp: number;
  };
}

// Initial State
const DEFAULT_STATE: PushState = {
  hasBeenPrompted: false,
  wantsPush: false,
  subscription: null
};

export class PushStateManager {
  private static state: PushState = DEFAULT_STATE;

  // Sichere Überprüfung der Notification API
  static getNotificationAPI(): { supported: boolean; api: typeof Notification | null } {
    try {
      if (typeof window === 'undefined') {
        return { supported: false, api: null };
      }
      
      // @ts-ignore - wir prüfen erst ob die API existiert
      const NotificationAPI = window.Notification;
      
      if (!NotificationAPI) {
        return { supported: false, api: null };
      }

      return { 
        supported: true, 
        api: NotificationAPI 
      };
    } catch (error) {
      console.error('[PushStateManager] Error accessing Notification API:', error);
      return { supported: false, api: null };
    }
  }

  // Überprüfe ob Push-Benachrichtigungen unterstützt werden
  private static isPushSupported(): boolean {
    try {
      return typeof window !== 'undefined' && 
        'Notification' in window && 
        'serviceWorker' in navigator && 
        'PushManager' in window &&
        Notification !== undefined;
    } catch (error) {
      console.error('[PushStateManager] Error checking push support:', error);
      return false;
    }
  }

  // Hole den aktuellen Permission-Status sicher
  private static getNotificationPermission(): NotificationPermission {
    try {
      if (!this.isPushSupported()) return 'denied';
      return Notification.permission;
    } catch (error) {
      console.error('[PushStateManager] Error getting notification permission:', error);
      return 'denied';
    }
  }

  // State aus localStorage laden
  static init() {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem(PUSH_STATE_KEY);
    if (stored) {
      try {
        this.state = JSON.parse(stored);
        // Migration: Füge wantsPush hinzu wenn es fehlt
        if (typeof this.state.wantsPush === 'undefined') {
          this.state.wantsPush = !!this.state.subscription;
        }
      } catch (e) {
        console.error('[PushStateManager] Fehler beim Laden des States:', e);
        this.state = DEFAULT_STATE;
      }
    }

    // Cleanup: Alte Storage Keys entfernen
    localStorage.removeItem('push-permission-asked');
    localStorage.removeItem('push-pending-changes');
  }

  // State in localStorage speichern
  private static save() {
    if (!this.isPushSupported()) return;
    localStorage.setItem(PUSH_STATE_KEY, JSON.stringify(this.state));
  }

  // Subscription Status
  static async getCurrentState(): Promise<{
    hasSubscription: boolean;
    isUserSubscribed: boolean;
    wantsPush: boolean;
    subscription: PushSubscriptionData | null;
  }> {
    if (!this.isPushSupported()) {
      return { 
        hasSubscription: false, 
        isUserSubscribed: false, 
        wantsPush: false,
        subscription: null 
      };
    }

    try {
      // Browser-Subscription holen
      const registration = await navigator.serviceWorker.ready;
      const browserSub = await registration.pushManager.getSubscription();

      if (!browserSub) {
        // Keine Browser-Subscription -> State zurücksetzen
        this.state.subscription = null;
        this.save();
        return { 
          hasSubscription: false, 
          isUserSubscribed: false,
          wantsPush: this.state.wantsPush,
          subscription: null 
        };
      }

      // State aktualisieren wenn nötig
      if (!this.state.subscription || this.state.subscription.endpoint !== browserSub.endpoint) {
        const p256dhKey = browserSub.getKey('p256dh');
        const authKey = browserSub.getKey('auth');
        
        this.state.subscription = {
          endpoint: browserSub.endpoint,
          keys: {
            p256dh: p256dhKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey)))) : '',
            auth: authKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey)))) : ''
          },
          userIds: this.state.subscription?.userIds || []
        };
        this.save();
      }

      const userId = this.getCurrentUserId();
      return {
        hasSubscription: true,
        isUserSubscribed: userId ? this.state.subscription.userIds.includes(userId) : false,
        wantsPush: this.state.wantsPush,
        subscription: this.state.subscription
      };
    } catch (error) {
      console.error('[PushStateManager] Error getting current state:', error);
      return {
        hasSubscription: false,
        isUserSubscribed: false,
        wantsPush: false,
        subscription: null
      };
    }
  }

  // User Management
  private static getCurrentUserId(): string | null {
    try {
      const authData = localStorage.getItem('auth');
      if (!authData) return null;
      const { user } = JSON.parse(authData);
      return user?.id || null;
    } catch (e) {
      return null;
    }
  }

  static cleanupUserData(userId: string) {
    // Alte user-specific keys entfernen
    localStorage.removeItem(`push-manually-disabled-${userId}`);
    localStorage.removeItem(`push-manually-disabled-timestamp-${userId}`);
  }

  // Permission Management
  static markPrompted() {
    this.state.hasBeenPrompted = true;
    this.save();
  }

  static hasBeenPrompted(): boolean {
    return this.state.hasBeenPrompted;
  }

  // Subscription Management
  static async subscribe(userId?: string): Promise<boolean> {
    const { supported, api } = this.getNotificationAPI();
    
    if (!supported || !api) {
      throw new Error('Push wird nicht unterstützt');
    }

    // Prüfe ob wir eine Permission haben
    if (api.permission !== 'granted') {
      const permission = await api.requestPermission();
      if (permission !== 'granted') {
        return false;
      }
    }

    this.state.wantsPush = true;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });
    }

    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');

    this.state.subscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: p256dhKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey)))) : '',
        auth: authKey ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey)))) : ''
      },
      userIds: userId ? [userId] : []
    };

    this.save();
    return true;
  }

  static async unsubscribe(userId?: string): Promise<boolean> {
    if (!this.state.subscription) return true;

    if (userId) {
      // Nur User entfernen
      this.state.subscription.userIds = this.state.subscription.userIds.filter(id => id !== userId);
      this.save();
      return true;
    }

    // Komplette Subscription entfernen
    this.state.wantsPush = false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
    }

    this.state.subscription = null;
    this.save();
    return true;
  }

  // Offline Support
  static setOfflineAction(type: 'subscribe' | 'unsubscribe') {
    this.state.offlineAction = {
      type,
      timestamp: Date.now()
    };
    this.save();
  }

  static getOfflineAction() {
    return this.state.offlineAction;
  }

  static clearOfflineAction() {
    delete this.state.offlineAction;
    this.save();
  }

  // Auto-Aktivierung wenn Permission vorhanden
  static async tryReactivate(userId?: string): Promise<boolean> {
    const { supported, api } = this.getNotificationAPI();
    
    if (!supported || !api) {
      return false;
    }

    // Nur wenn User Push will und Permission hat
    if (!this.state.wantsPush || api.permission !== 'granted') {
      return false;
    }

    try {
      await this.subscribe(userId);
      return true;
    } catch (e) {
      console.error('[PushStateManager] Fehler bei Auto-Aktivierung:', e);
      return false;
    }
  }
} 