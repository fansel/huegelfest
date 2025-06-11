type AuthEventCallback = () => void;

class AuthEventEmitter {
  private static instance: AuthEventEmitter;
  private listeners: Map<string, Set<AuthEventCallback>>;

  private constructor() {
    this.listeners = new Map();
  }

  static getInstance(): AuthEventEmitter {
    if (!AuthEventEmitter.instance) {
      AuthEventEmitter.instance = new AuthEventEmitter();
    }
    return AuthEventEmitter.instance;
  }

  on(event: string, callback: AuthEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: AuthEventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[AuthEvents] Error in event handler:', error);
      }
    });
  }
}

export const authEvents = AuthEventEmitter.getInstance();

// Event-Konstanten
export const AUTH_EVENTS = {
  SESSION_UPDATED: 'session_updated',
  ROLE_CHANGED: 'role_changed',
  LOGGED_OUT: 'logged_out'
} as const; 