'use client';

import { useState } from 'react';
import { Switch } from "@/shared/components/ui/switch";
import UserSettingsCard from './UserSettingsCard';
import { Bell, AlertCircle, Settings, WifiOff } from 'lucide-react';
import { usePushSubscription } from '@/features/push/hooks/usePushSubscription';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { useServerStatus } from '@/shared/hooks/useServerStatus';
import { useAuth } from '@/features/auth/AuthContext';

interface PushNotificationSettingsProps {
  variant?: 'row' | 'tile';
}

export default function PushNotificationSettings({ variant = 'row' }: PushNotificationSettingsProps) {
  const { isServerOnline, isBrowserOnline } = useServerStatus();
  const { isTemporarySession } = useAuth();
  const {
    isSubscribed,
    isLoading,
    isSupported,
    isOnline,
    error,
    subscribe,
    unsubscribe
  } = usePushSubscription();

  const [showStatusDetails, setShowStatusDetails] = useState(false);
  
  const browserPermission = (() => {
    try {
      return typeof window !== 'undefined' && 'Notification' in window && Notification
        ? Notification.permission 
        : 'default';
    } catch (error) {
      console.error('[PushNotificationSettings] Error checking notification permission:', error);
      return 'default';
    }
  })();

  const handleToggle = async (checked: boolean) => {
    if (isLoading || !isSupported || !isOnline || isTemporarySession) return;

    if (checked) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

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
            </div>
          </div>

          {error && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-500">Letzter Fehler</h4>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  const getIcon = () => {
    if (!isSupported) return <AlertCircle className="h-5 w-5 text-[#ff9900]" />;
    if (isLoading) return <Settings className="h-5 w-5 text-[#ff9900] animate-spin" />;
    if (!isOnline) return <WifiOff className="h-5 w-5 text-[#ff9900]" />;
    if (isSubscribed) return <Bell className="h-5 w-5 text-[#ff9900]" />;
    return <Bell className="h-5 w-5 text-[#ff9900]" />;
  };

  const info = (
    <div className="space-y-2">
      <p>Erhalte wichtige Updates zum Festival direkt auf dein Gerät, auch wenn die App geschlossen ist.</p>
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
            disabled={!isSupported || isLoading || !isOnline || isTemporarySession}
          />
        }
        info={info}
        variant={variant}
      >
        {isTemporarySession && (
          <div className="text-sm text-amber-600 mt-2">
            In einer temporären Session deaktiviert.
          </div>
        )}
        {browserPermission === 'denied' && (
          <div className="text-sm text-red-500 mt-2">
            Push-Benachrichtigungen sind in den Browser-Einstellungen blockiert.
          </div>
        )}
        {!isOnline && (
          <div className="text-sm text-amber-600 mt-2">
            Du bist offline. Eine Änderung ist nicht möglich.
          </div>
        )}
      </UserSettingsCard>
      <StatusDetailsDialog />
    </>
  );
}
