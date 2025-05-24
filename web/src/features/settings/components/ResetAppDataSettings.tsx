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
      // 1. Logout über Server Action (löscht HTTP-Only Cookies)
      await logout();
      
      // 2. Client-side Storage löschen
      localStorage.clear();
      sessionStorage.clear();
      
      // 3. Alle verfügbaren Cookies löschen (für nicht HTTP-Only Cookies)
      document.cookie.split(';').forEach(c => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
      });
      
      // 4. IndexedDB komplett löschen
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map(db => {
              if (db.name) {
                return new Promise<void>((resolve) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve();
                  deleteReq.onerror = () => resolve(); // Auch bei Fehler weitermachen
                });
              }
            })
          );
        } catch (error) {
          console.warn('IndexedDB konnte nicht vollständig gelöscht werden:', error);
        }
      }
      
      // 5. Service Worker unregistrieren und Cache löschen
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(registration => registration.unregister()));
        } catch (error) {
          console.warn('Service Worker konnte nicht deregistriert werden:', error);
        }
      }
      
      // 6. Alle Cache Storage APIs löschen
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        } catch (error) {
          console.warn('Caches konnten nicht vollständig gelöscht werden:', error);
        }
      }
      
      // 7. WebSQL löschen (deprecated aber sicherheitshalber)
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
          }
        } catch (error) {
          console.warn('WebSQL konnte nicht gelöscht werden:', error);
        }
      }
      
      // 8. Broadcast an andere Tabs senden
      if ('BroadcastChannel' in window) {
        try {
          const channel = new BroadcastChannel('app-reset');
          channel.postMessage({ type: 'RESET_ALL_DATA' });
          channel.close();
        } catch (error) {
          console.warn('Broadcast konnte nicht gesendet werden:', error);
        }
      }
      
      // 9. Page reload nach kurzer Verzögerung für vollständige Bereinigung
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der App-Daten:', error);
      setIsResetting(false);
      // Fallback: Trotzdem reload versuchen
      window.location.reload();
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