"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { updateService } from '@/lib/updateService';
import UserSettingsCard from './UserSettingsCard';
import toast from 'react-hot-toast';

interface AppUpdateSettingsProps {
  variant?: 'row' | 'tile';
}

export default function AppUpdateSettings({ variant = 'row' }: AppUpdateSettingsProps) {
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Version-Informationen laden
    const info = updateService.getVersionInfo();
    setVersionInfo(info);
  }, []);

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    try {
      // Service Worker Update prüfen
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          
          if (registration.waiting) {
            toast.success('Update verfügbar! App wird neu geladen...');
            setTimeout(() => {
              handleForceUpdate();
            }, 2000);
          } else {
            toast.success('App ist bereits auf dem neuesten Stand! ');
          }
        }
      }
    } catch (error) {
      console.error('Fehler beim Update-Check:', error);
      toast.error('Fehler beim Prüfen auf Updates');
    } finally {
      setIsChecking(false);
    }
  };

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateService.forceReload();
    } catch (error) {
      console.error('Fehler beim Update:', error);
      toast.error('Fehler beim Aktualisieren der App');
      setIsUpdating(false);
    }
  };

  const formatDate = (timestamp: string | null) => {
    if (!timestamp) return 'Unbekannt';
    return new Date(parseInt(timestamp)).toLocaleString('de-DE');
  };

  const shortenVersion = (version: string | null) => {
    if (!version) return 'Unbekannt';
    return version.length > 7 ? version.substring(0, 7) : version;
  };

  // Versionsdetails für Info-Icon
  const getVersionDetails = () => {
    if (!versionInfo) return 'Keine Versionsinformationen verfügbar';
    
    return (
      <div className="space-y-3">
        <div className="border-b border-gray-200 pb-2">
          <h4 className="font-semibold text-gray-900 mb-2">App-Version</h4>
          <div className="space-y-1 text-sm">
            <div><strong>Aktuelle Version:</strong> <span className="font-mono">{versionInfo.current || 'Unbekannt'}</span></div>
            <div><strong>Gespeicherte Version:</strong> <span className="font-mono">{versionInfo.stored || 'Erste Installation'}</span></div>
          </div>
        </div>
        
        <div className="border-b border-gray-200 pb-2">
          <h4 className="font-semibold text-gray-900 mb-2">Update-Status</h4>
          <div className="space-y-1 text-sm">
            <div><strong>Letzter Check:</strong> {formatDate(versionInfo.lastCheck)}</div>
            <div><strong>Update verfügbar:</strong> 
              {versionInfo.updateAvailable ? (
                <span className="text-green-600 font-semibold ml-1">✓ Ja</span>
              ) : (
                <span className="text-blue-600 ml-1">Nein - aktuell</span>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <div><strong>Automatische Checks:</strong> Alle 30 Minuten</div>
          <div><strong>Service Worker:</strong> {typeof window !== 'undefined' && 'serviceWorker' in navigator ? 'Verfügbar' : 'Nicht verfügbar'}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Update-Check mit Version-Informationen */}
      <UserSettingsCard
        icon={<RefreshCw className="w-5 h-5 text-blue-600" />}
        title={`Nach Updates suchen (v${shortenVersion(versionInfo?.current)})`}
        switchElement={
          <Button
            variant="outline"
            onClick={handleCheckForUpdates}
            disabled={isChecking || isUpdating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Prüfe...' : 'Prüfen'}
          </Button>
        }
        info={getVersionDetails()}
        variant={variant}
      />

      {/* Force Update */}
      {versionInfo?.updateAvailable && (
        <UserSettingsCard
          icon={<Download className="w-5 h-5 text-green-600" />}
          title="Update installieren"
          switchElement={
            <Button
              variant="default"
              onClick={handleForceUpdate}
              disabled={isUpdating}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Download className={`w-4 h-4 ${isUpdating ? 'animate-bounce' : ''}`} />
              {isUpdating ? 'Aktualisiere...' : 'Jetzt updaten'}
            </Button>
          }
          info="Neue Version verfügbar - jetzt aktualisieren"
          variant={variant}
        />
      )}
    </div>
  );
} 