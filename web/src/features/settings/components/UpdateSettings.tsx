'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/shared/components/ui/button";
import UserSettingsCard from "./UserSettingsCard";
import { updateService } from '@/lib/updateService';
import { APP_VERSION, VERSION_STORAGE_KEYS } from '@/lib/config/appVersion';
import { toast } from 'react-hot-toast';
import { getAppInfoAction } from '../actions/updateActions';
import { RefreshCw, Check } from 'lucide-react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

interface UpdateSettingsProps {
  variant?: 'row' | 'tile';
}

export function UpdateSettings({ variant = 'tile' }: UpdateSettingsProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [versionInfo, setVersionInfo] = useState({
    current: APP_VERSION.getAppIdentifier(),
    environment: APP_VERSION.isDevelopment ? 'Development' : 'Production'
  });
  const isOnline = useNetworkStatus();

  // Real-time Update-Status mit Custom Events
  useEffect(() => {
    checkUpdateStatus();
    loadVersionInfo();
    
    // Sofortige Reaktion auf Storage-Änderungen
    const handleUpdateChange = (event: any) => {
      setUpdateAvailable(event.detail.available);
      checkUpdateStatus(); // Auch andere Daten neu laden
    };

    // Custom Event Listener für sofortige Updates
    window.addEventListener('updateAvailableChange', handleUpdateChange);
    
    // Automatische Status-Updates alle 2 Sekunden (reduziert von 5s)
    const interval = setInterval(checkUpdateStatus, 2000);
    
    return () => {
      window.removeEventListener('updateAvailableChange', handleUpdateChange);
      clearInterval(interval);
    };
  }, []);

  const loadVersionInfo = async () => {
    try {
      const appInfo = await getAppInfoAction();
      setVersionInfo({
        current: appInfo.identifier,
        environment: appInfo.environment
      });
    } catch (error) {
      console.warn('[UpdateSettings] Fehler beim Laden der App-Info:', error);
    }
  };

  const checkUpdateStatus = () => {
    const hasUpdate = localStorage.getItem(VERSION_STORAGE_KEYS.UPDATE_AVAILABLE) === 'true';
    const lastCheck = localStorage.getItem(VERSION_STORAGE_KEYS.LAST_UPDATE_CHECK);
    
    setUpdateAvailable(hasUpdate);
    setLastCheckTime(lastCheck ? new Date(parseInt(lastCheck)).toLocaleString('de-DE') : null);
  };

  const handleApplyUpdate = async () => {
    if (!isOnline) {
      toast.error('Update-Installation ist nur online möglich');
      return;
    }
    
    try {
      await updateService.forceUpdate();
    } catch (error) {
      toast.error('Fehler beim Anwenden des Updates');
    }
  };

  // Switch-Element: Update-Apply Button oder Checkmark
  const switchElement = updateAvailable ? (
        <Button 
          variant="default" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleApplyUpdate();
          }}
          disabled={!isOnline}
          className={`text-xs ${
            isOnline 
              ? 'bg-[#ff9900] hover:bg-[#e6890a] text-white' 
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }`}
          title={!isOnline ? 'Update-Installation ist nur online möglich' : undefined}
        >
          {isOnline ? 'Update anwenden' : 'Update anwenden (offline)'}
        </Button>
      ) : (
    <div className="text-xs text-green-600 px-3 py-1 flex items-center gap-1.5">
      <Check className="h-3 w-3" />
      <span>Aktuell</span>
    </div>
  );

  // Info-Text für Tooltip
  const infoText = (
    <div className="space-y-2">
      <p>Automatisches Update-System - Updates werden automatisch erkannt und angezeigt.</p>
      <div className="space-y-1">
        <p><strong>Vollautomatisches System:</strong></p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Keine manuelle Prüfung nötig:</strong> Updates werden automatisch erkannt</li>
          <li><strong>WebSocket Push-Updates:</strong> Sofortige Benachrichtigung bei neuen Versionen</li>
          <li><strong>Background-Checks:</strong> Automatische Prüfung alle 30 Sekunden</li>
          <li><strong>Service Worker Integration:</strong> Erkennt Asset-Updates automatisch</li>
          <li><strong>Development:</strong> Sofortige Updates ohne User-Eingriff</li>
          <li><strong>Production:</strong> Kontrollierte Updates mit einem Klick</li>
        </ul>
      </div>
      <div className="mt-2 pt-2 border-t space-y-1 text-xs text-gray-600">
        <div><strong>Aktuelle Version:</strong> {versionInfo.current}</div>
        <div><strong>Environment:</strong> {versionInfo.environment}</div>
        {lastCheckTime && <div><strong>Letzte Prüfung:</strong> {lastCheckTime}</div>}
        {updateAvailable && (
          <div className="text-[#ff9900] font-medium">
            ⚡ Update verfügbar!
          </div>
        )}
        {!updateAvailable && (
          <div className="text-green-600 font-medium">
            ✅ Du hast die neueste Version
          </div>
        )}
      </div>
    </div>
  );

  return (
    <UserSettingsCard
      icon={<RefreshCw className="h-5 w-5" />}
      title="App-Updates"
      switchElement={switchElement}
      info={infoText}
      variant={variant}
    />
  );
} 