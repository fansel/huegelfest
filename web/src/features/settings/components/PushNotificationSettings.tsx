'use client';

import { useState, useEffect } from 'react';
import { Switch } from "@/shared/components/ui/switch";
import { useServerStatus } from '@/shared/hooks/useServerStatus';
import UserSettingsCard from './UserSettingsCard';
import { Bell, AlertCircle, Settings, WifiOff } from 'lucide-react';
import { usePushSubscription } from '@/features/push/hooks/usePushSubscription';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

interface PushNotificationSettingsProps {
  variant?: 'row' | 'tile';
}

export default function PushNotificationSettings({ variant = 'row' }: PushNotificationSettingsProps) {
  const { isServerOnline, isBrowserOnline, isFullyOnline } = useServerStatus();
  const {
    isSubscribed,
    isLoading,
    isSupported,
    error,
    subscribe,
    unsubscribe
  } = usePushSubscription();

  // Browser-Permission Status
  const browserPermission = typeof window !== 'undefined' && 'Notification' in window 
    ? Notification.permission 
    : 'default';

  // Status-Dialog
  const [showStatusDetails, setShowStatusDetails] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Hole Pending Changes Status
  const pendingChanges = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('push-pending-changes') || '[]')
    : [];
  const hasPendingChanges = pendingChanges.length > 0;

  // Aktualisiere lastSync wenn Änderungen synchronisiert wurden
  useEffect(() => {
    if (!hasPendingChanges && lastSync === null) {
      setLastSync(new Date());
    }
  }, [hasPendingChanges]);

  const handleToggle = async (checked: boolean) => {
    try {
      if (isLoading || !isSupported) return;

      if (checked) {
        // Nur aktivieren wenn Berechtigung bereits erteilt wurde oder neu angefragt wird
        if (browserPermission === 'granted') {
          await subscribe();
        } else {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            await subscribe();
          } else {
            toast.error('Bitte erlaube Push-Benachrichtigungen in den Browser-Einstellungen');
          }
        }
      } else {
        await unsubscribe();
      }
    } catch (err) {
      // Ignoriere userId-bezogene Fehler, da diese normal sind wenn der User nicht eingeloggt ist
      if (err instanceof Error && !err.message.includes('userId') && !err.message.includes('user.id')) {
        toast.error('Fehler bei Push-Benachrichtigungen: ' + err.message);
      }
    }
  };

  // Status Details Dialog
  const StatusDetailsDialog = () => (
    <Dialog open={showStatusDetails} onOpenChange={setShowStatusDetails}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#ff9900]" />
            Push-Benachrichtigungen Status
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">System Status</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">Browser Support:</span>
              <span>{isSupported ? '✅' : '❌'}</span>
              
              <span className="text-gray-500">Browser Online:</span>
              <span>{isBrowserOnline ? '✅' : '❌'}</span>
              
              <span className="text-gray-500">Server Online:</span>
              <span>{isServerOnline ? '✅' : '❌'}</span>
              
              <span className="text-gray-500">Browser Permission:</span>
              <span>{browserPermission}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Subscription Status</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">Aktiv:</span>
              <span>{isSubscribed ? '✅' : '❌'}</span>
              
              <span className="text-gray-500">Ausstehende Änderungen:</span>
              <span>{hasPendingChanges ? `Ja (${pendingChanges.length})` : 'Nein'}</span>
              
              {lastSync && (
                <>
                  <span className="text-gray-500">Letzte Synchronisation:</span>
                  <span>{lastSync.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>

          {error && !error.includes('userId') && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-500">Fehler</h4>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Icon basierend auf Status
  const getIcon = () => {
    if (!isSupported) return <AlertCircle className="h-5 w-5 text-[#ff9900]" />;
    if (isLoading) return <Settings className="h-5 w-5 text-[#ff9900] animate-spin" />;
    if (!isFullyOnline) return <WifiOff className="h-5 w-5 text-[#ff9900]" />;
    if (hasPendingChanges) return <Settings className="h-5 w-5 text-[#ff9900]" />;
    if (isSubscribed) return <Bell className="h-5 w-5 text-[#ff9900]" />;
    return <Bell className="h-5 w-5 text-[#ff9900]" />;
  };

  // Info Text mit Status Details Button
  const info = (
    <div className="space-y-2">
      <p>Push-Benachrichtigungen ermöglichen es dir, wichtige Updates zum Festival direkt zu erhalten, auch wenn die App geschlossen ist.</p>
      <p>Du kannst sie jederzeit aktivieren oder deaktivieren.</p>
      <button 
        onClick={() => setShowStatusDetails(true)}
        className="text-[#ff9900] hover:text-[#ff9900]/80 underline text-sm"
      >
        Status Details anzeigen
      </button>
    </div>
  );

  return (
    <>
      <UserSettingsCard
        icon={getIcon()}
        title="Push-Benachrichtigungen"
        switchElement={
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={!isSupported || isLoading}
          />
        }
        info={info}
        variant={variant}
      >
        {browserPermission === 'denied' && (
          <div className="text-sm text-red-500 mt-2">
            Push-Benachrichtigungen sind blockiert
          </div>
        )}
      </UserSettingsCard>
      <StatusDetailsDialog />
    </>
  );
}
