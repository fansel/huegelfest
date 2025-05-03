import { webPushService } from './webpush';

// Diese Funktion wird nur auf der Server-Seite ausgeführt
export function initializeServer() {
  if (typeof window === 'undefined') {
    try {
      // Initialisiere WebPush-Service nur auf der Server-Seite
      webPushService.initialize();
    } catch (error) {
      // Fehler bei der Initialisierung sollten den Build nicht blockieren
      console.warn('Fehler bei der Server-Initialisierung:', error);
    }
  }
}

// Initialisiere den Server beim Import
initializeServer(); 