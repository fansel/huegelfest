import React, { useState } from 'react';
import UserSettingsCard from './UserSettingsCard';
import { Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { logout } from '@/features/auth/actions/logout';

interface ResetAppDataSettingsProps {
  variant?: 'row' | 'tile';
}

const ResetAppDataSettings: React.FC<ResetAppDataSettingsProps> = ({ variant = 'row' }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    
    try {
      console.log('[Reset] Starte vollständigen App-Reset...');
      
      // 0. ZUERST: Signal an alle Tabs senden BEVOR wir löschen
      if ('BroadcastChannel' in window) {
        try {
          const channel = new BroadcastChannel('app-reset');
          channel.postMessage({ type: 'RESET_ALL_DATA_PREPARE' });
          console.log('[Reset] Prepare-Signal an andere Tabs gesendet');
          // Channel offen lassen für weitere Nachrichten
        } catch (error) {
          console.warn('Broadcast konnte nicht gesendet werden:', error);
        }
      }
      
      // 1. Service Worker ZUERST stoppen um neue Cache-Writes zu verhindern
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log(`[Reset] ${registrations.length} Service Worker gefunden`);
          await Promise.all(registrations.map(async registration => {
            console.log(`[Reset] Stoppe Service Worker: ${registration.scope}`);
            await registration.unregister();
          }));
          console.log('[Reset] Alle Service Worker gestoppt');
        } catch (error) {
          console.warn('Service Worker konnte nicht deregistriert werden:', error);
        }
      }
      
      // 2. Alle Cache Storage APIs löschen
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          console.log(`[Reset] ${cacheNames.length} Caches gefunden: ${cacheNames.join(', ')}`);
          await Promise.all(cacheNames.map(async cacheName => {
            console.log(`[Reset] Lösche Cache: ${cacheName}`);
            await caches.delete(cacheName);
          }));
          console.log('[Reset] Alle Caches gelöscht');
        } catch (error) {
          console.warn('Caches konnten nicht vollständig gelöscht werden:', error);
        }
      }
      
      // 3. IndexedDB komplett löschen
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          console.log(`[Reset] ${databases.length} IndexedDB-Datenbanken gefunden`);
          await Promise.all(
            databases.map(async db => {
              if (db.name) {
                console.log(`[Reset] Lösche IndexedDB: ${db.name}`);
                return new Promise<void>((resolve) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => {
                    console.log(`[Reset] IndexedDB ${db.name} gelöscht`);
                    resolve();
                  };
                  deleteReq.onerror = (e) => {
                    console.warn(`[Reset] Fehler beim Löschen von IndexedDB ${db.name}:`, e);
                    resolve(); // Auch bei Fehler weitermachen
                  };
                });
              }
            })
          );
          console.log('[Reset] Alle IndexedDB-Datenbanken gelöscht');
        } catch (error) {
          console.warn('IndexedDB konnte nicht vollständig gelöscht werden:', error);
        }
      }
      
      // 4. Logout über Server Action (löscht HTTP-Only Cookies)
      try {
        await logout();
        console.log('[Reset] Server-Logout durchgeführt');
      } catch (error) {
        console.warn('[Reset] Server-Logout fehlgeschlagen:', error);
      }
      
      // 5. Alle verfügbaren Client-Cookies löschen (für nicht HTTP-Only Cookies)
      const cookies = document.cookie.split(';');
      console.log(`[Reset] ${cookies.length} Client-Cookies gefunden`);
      cookies.forEach((c, index) => {
        const cookie = c.replace(/^ +/, '').replace(/=.*/, '');
        if (cookie) {
          // Verschiedene Kombinationen von Domain und Path versuchen
          document.cookie = `${cookie}=;expires=${new Date(0).toUTCString()};path=/`;
          document.cookie = `${cookie}=;expires=${new Date(0).toUTCString()};path=/;domain=${window.location.hostname}`;
          document.cookie = `${cookie}=;expires=${new Date(0).toUTCString()};path=/;domain=.${window.location.hostname}`;
          console.log(`[Reset] Cookie gelöscht: ${cookie}`);
        }
      });
      
      // 6. WICHTIG: SWR Cache stoppen und localStorage mehrfach löschen
      // Zuerst localStorage komplett leeren
      console.log(`[Reset] localStorage hat ${localStorage.length} Einträge`);
      const allKeys = Object.keys(localStorage);
      console.log('[Reset] localStorage Keys:', allKeys);
      
      // Explizit alle bekannten Keys löschen (für den Fall dass clear() nicht funktioniert)
      const knownKeys = [
        'swr-cache',
        'deviceId', 
        'festival-registration',
        'packlist-items',
        'favorites',
        'ui-starfield-enabled',
        'ui-musicnote-enabled',
        'pwa-prompt-dismissed',
        'app-version',
        'last-update-check', 
        'last-handled-update',
        'update-available',
        'device-transfer-completed',
        // Push-spezifische Keys
        'push-subscription',
        'push-permission-state'
      ];
      
      // Auch dynamische Keys mit Patterns löschen
      allKeys.forEach(key => {
        if (key.startsWith('push-manually-disabled-') || 
            key.startsWith('push-manually-disabled-timestamp-') ||
            key.startsWith('push-asked-before-') ||
            key.startsWith('push-was-active-before-transfer-') ||
            key.startsWith('push-was-active-timestamp-')) {
          localStorage.removeItem(key);
          console.log(`[Reset] Dynamic localStorage key entfernt: ${key}`);
        }
      });
      
      knownKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`[Reset] Bekannter localStorage key entfernt: ${key}`);
      });
      
      // Push-Service-Worker-Subscription zurücksetzen
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            console.log('[Reset] Push-Subscription deaktiviert');
          }
        } catch (error) {
          console.warn('[Reset] Fehler beim Zurücksetzen der Push-Subscription:', error);
        }
      }
      
      // WICHTIG: Reset-Flag setzen um automatische Push-Aktivierung zu verhindern
      // Auch wenn Browser-Permission noch "granted" ist, soll nicht automatisch aktiviert werden
      localStorage.setItem('app-data-reset-happened', 'true');
      localStorage.setItem('app-data-reset-timestamp', Date.now().toString());
      console.log('[Reset] Reset-Flag gesetzt - verhindert automatische Push-Aktivierung');
      
      // Dann komplettes localStorage leeren
      localStorage.clear();
      console.log('[Reset] localStorage.clear() ausgeführt');
      
      // 7. SessionStorage leeren
      console.log(`[Reset] sessionStorage hat ${sessionStorage.length} Einträge`);
      sessionStorage.clear();
      console.log('[Reset] sessionStorage.clear() ausgeführt');
      
      // 8. WebSQL löschen (deprecated aber sicherheitshalber)
      if ('webkitStorageInfo' in window && 'requestQuota' in (window as any).webkitStorageInfo) {
        try {
          // @ts-ignore - WebSQL ist deprecated
          if (window.openDatabase) {
            // @ts-ignore
            const db = window.openDatabase('', '', '', '');
            if (db) {
              db.transaction((tx: any) => {
                tx.executeSql('DROP TABLE IF EXISTS data');
              });
            }
            console.log('[Reset] WebSQL gelöscht');
          }
        } catch (error) {
          console.warn('WebSQL konnte nicht gelöscht werden:', error);
        }
      }
      
      // 9. Final-Signal an andere Tabs senden
      if ('BroadcastChannel' in window) {
        try {
          const channel = new BroadcastChannel('app-reset');
          channel.postMessage({ type: 'RESET_ALL_DATA_COMPLETE' });
          console.log('[Reset] Complete-Signal an andere Tabs gesendet');
          channel.close();
        } catch (error) {
          console.warn('Final Broadcast konnte nicht gesendet werden:', error);
        }
      }
      
      // 10. Kurz warten damit alles abgeschlossen wird, dann nochmal localStorage prüfen und leeren
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (localStorage.length > 0) {
        console.warn(`[Reset] localStorage hat immer noch ${localStorage.length} Einträge nach Reset!`);
        console.warn('[Reset] Verbleibende Keys:', Object.keys(localStorage));
        localStorage.clear(); // Nochmal versuchen
        console.log('[Reset] Zweiter localStorage.clear() ausgeführt');
      }
      
      console.log('[Reset] Vollständiger Reset abgeschlossen - führe Reload durch...');
      
      // 11. Page reload nach kurzer Verzögerung für vollständige Bereinigung
      setTimeout(() => {
        // Force hard reload um Cache zu umgehen
        window.location.href = window.location.href;
      }, 300);
      
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der App-Daten:', error);
      setIsResetting(false);
      
      // Fallback: Trotzdem localStorage leeren und reload versuchen
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Auch Fallback-Clear fehlgeschlagen:', e);
      }
      
      // Force hard reload auch bei Fehler
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 500);
    }
  };

  return (
    <UserSettingsCard
      icon={<Trash2 className="w-5 h-5 text-red-600" />}
      title="Alle App-Daten zurücksetzen"
      switchElement={
        <Button
          variant="destructive"
          className="flex items-center gap-2 text-base py-2 px-4 rounded-xl border-2 border-red-400"
          onClick={() => setShowConfirm(true)}
          disabled={isResetting}
        >
          <Trash2 className="w-5 h-5" />
          {isResetting ? 'Wird zurückgesetzt...' : 'Zurücksetzen'}
        </Button>
      }
      variant={variant}
    >
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-4 max-w-xs w-full">
            <div className="text-lg font-bold text-red-600 text-center">Wirklich alle App-Daten löschen?</div>
            <div className="text-sm text-gray-700 text-center">
              Das entfernt alle gespeicherten Einstellungen, Admin-Anmeldungen, Offline-Daten, 
              Cache und Service Worker auf diesem Gerät. Die App wird komplett zurückgesetzt.
            </div>
            <div className="flex gap-3 w-full mt-2">
              <Button 
                className="flex-1" 
                variant="secondary" 
                onClick={() => setShowConfirm(false)}
                disabled={isResetting}
              >
                Abbrechen
              </Button>
              <Button 
                className="flex-1 bg-red-600 text-white hover:bg-red-700" 
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? 'Wird gelöscht...' : 'Ja, löschen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </UserSettingsCard>
  );
};

export default ResetAppDataSettings; 