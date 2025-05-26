'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/shared/components/ui/button";
import UserSettingsCard from "./UserSettingsCard";
import { updateService } from '@/lib/updateService';
import { APP_VERSION, VERSION_STORAGE_KEYS } from '@/lib/config/appVersion';
import { toast } from 'react-hot-toast';
import { checkForUpdatesAction, getAppInfoAction } from '../actions/updateActions';
import { RefreshCw } from 'lucide-react';

interface UpdateSettingsProps {
  variant?: 'row' | 'tile';
}

export function UpdateSettings({ variant = 'tile' }: UpdateSettingsProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [versionInfo, setVersionInfo] = useState({
    current: APP_VERSION.getAppIdentifier(),
    environment: APP_VERSION.isDevelopment ? 'Development' : 'Production'
  });

  // Check Update-Status beim Mount
  useEffect(() => {
    checkUpdateStatus();
    loadVersionInfo();
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

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    
    try {
      // Nutze WebSocket-basierte Update-Prüfung über UpdateService
      const hasUpdate = await updateService.checkForUpdatesManual();
      
      // Zusätzlich: Server Action für genauere Prüfung
      const serverResult = await checkForUpdatesAction();
      
      if (serverResult.hasUpdate && serverResult.updateInfo) {
        localStorage.setItem(VERSION_STORAGE_KEYS.UPDATE_AVAILABLE, 'true');
        setUpdateAvailable(true);
        
        toast.success('Update verfügbar! Klicke auf "Update anwenden"', {
          duration: 5000,
          icon: '🎉'
        });
      } else if (!hasUpdate && !serverResult.hasUpdate) {
        toast.success('Du hast bereits die neueste Version!', {
          duration: 3000,
          icon: '✅'
        });
      }
      
      checkUpdateStatus(); // Status neu laden
    } catch (error) {
      toast.error('Fehler beim Prüfen auf Updates');
    } finally {
      setIsChecking(false);
    }
  };

  const handleApplyUpdate = async () => {
    try {
      await updateService.forceUpdate();
    } catch (error) {
      toast.error('Fehler beim Anwenden des Updates');
    }
  };

  // Switch-Element: Button für Update-Check oder Update-Apply
  const switchElement = (
    <div className="flex gap-2">
      {updateAvailable ? (
        <Button 
          variant="default" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleApplyUpdate();
          }}
          className="bg-[#ff9900] hover:bg-[#e6890a] text-white text-xs"
        >
          Update anwenden
        </Button>
      ) : (
        <Button 
          variant="outline" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleCheckForUpdates();
          }}
          disabled={isChecking}
          className="text-xs"
        >
          {isChecking ? 'Prüfe...' : 'Prüfen'}
        </Button>
      )}
    </div>
  );

  // Info-Text für Tooltip
  const infoText = (
    <div className="space-y-2">
      <p>Überprüfe und installiere App-Updates für neue Funktionen und Verbesserungen.</p>
      <div className="space-y-1">
        <p><strong>WebSocket Update-System:</strong></p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Development:</strong> Sofortige Updates via WebSocket</li>
          <li><strong>Production:</strong> Kontrollierte Updates mit Benachrichtigung</li>
          <li>Echte Push-Updates ohne Polling</li>
          <li>Server Actions für Update-Management</li>
          <li>Service Worker Updates für Offline-Funktionen</li>
          <li>PWA-Badge für Update-Benachrichtigungen</li>
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