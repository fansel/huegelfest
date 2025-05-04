import { webPushService } from './lazyServices';

// Diese Funktion wird nur auf der Server-Seite ausgeführt
export async function initializeServer() {
  if (typeof window === 'undefined') {
    try {
      // Initialisiere WebPush-Service nur auf der Server-Seite
      const service = await webPushService.getInstance();
      service.initialize();
    } catch (error) {
      // Fehler bei der Initialisierung sollten den Build nicht blockieren
      console.warn('Fehler bei der Server-Initialisierung:', error);
    }
  }
}

// Initialisiere den Server beim Import
initializeServer(); 

export async function initializeServices() {
  try {
    const service = await webPushService.getInstance();
    service.initialize();
  } catch (error) {
    console.error('Fehler bei der Initialisierung der Services:', error);
  }
} 