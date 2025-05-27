'use client';

import { useState } from 'react';
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import UserSettingsCard from './UserSettingsCard';
import { Bell, AlertCircle, Settings, WifiOff } from 'lucide-react';
import { usePushSubscription } from '@/features/push/hooks/usePushSubscription';
import { toast } from 'react-hot-toast';

interface PushNotificationSettingsProps {
  variant?: 'row' | 'tile';
}

export default function PushNotificationSettings({ variant = 'row' }: PushNotificationSettingsProps) {
  const deviceId = useDeviceId();
  const isOnline = useNetworkStatus();
  const {
    isSubscribed,
    isLoading,
    isSupported,
    error,
    subscribe,
    unsubscribe
  } = usePushSubscription();

  // Browser-Permission Status
  const browserPermission = typeof window !== 'undefined' ? Notification.permission : 'default';

  const handleSubscribe = async () => {
    if (isLoading || !isSupported || isSubscribed || !deviceId || !isOnline) return;

    try {
      const success = await subscribe();
      if (success) {
        toast.success('Push-Benachrichtigungen aktiviert! 🔔');
      } else {
        toast.error('Fehler beim Aktivieren der Push-Benachrichtigungen');
      }
    } catch (error) {
      console.error('Fehler beim Abonnieren:', error);
      toast.error('Fehler beim Aktivieren der Push-Benachrichtigungen');
    }
  };

  const handleUnsubscribe = async () => {
    if (isLoading || !isSupported || !isSubscribed || !isOnline) return;

    try {
      const success = await unsubscribe();
      if (success) {
        toast.success('Push-Benachrichtigungen deaktiviert');
      } else {
        toast.error('Fehler beim Deaktivieren der Push-Benachrichtigungen');
      }
    } catch (error) {
      console.error('Fehler beim Abbestellen:', error);
      toast.error('Fehler beim Deaktivieren der Push-Benachrichtigungen');
    }
  };

  const handleOpenBrowserSettings = () => {
    toast.error(
      'Push-Benachrichtigungen wurden blockiert.\n\n' +
      'So aktivierst du sie:\n' +
      '1. Klicke auf das Schloss-Symbol neben der URL\n' +
      '2. Setze "Benachrichtigungen" auf "Zulassen"\n' +
      '3. Lade die Seite neu',
      { duration: 10000 }
    );
  };

  // UI-Zustand bestimmen
  const getUIState = () => {
    if (!isSupported) {
      return {
        type: 'unsupported',
        icon: <AlertCircle className="w-5 h-5 text-gray-400" />,
        title: 'Push-Benachrichtigungen',
        info: 'Dein Browser unterstützt keine Push-Benachrichtigungen.',
        switchElement: null,
        disabled: true
      };
    }

    if (!isOnline) {
      return {
        type: 'offline',
        icon: <WifiOff className="w-5 h-5 text-gray-400" />,
        title: 'Push-Benachrichtigungen',
        info: 'Einstellungen werden bei der nächsten Verbindung synchronisiert.',
        switchElement: (
          <Switch 
            checked={isSubscribed} 
            disabled={true}
            className="opacity-50"
          />
        ),
        disabled: true
      };
    }

    if (browserPermission === 'denied') {
      return {
        type: 'denied',
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        title: 'Push-Benachrichtigungen',
        info: 'Push-Benachrichtigungen wurden in den Browser-Einstellungen blockiert.',
        switchElement: (
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenBrowserSettings}
            className="text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            Einstellungen
          </Button>
        ),
        disabled: false
      };
    }

    if (browserPermission === 'default') {
      return {
        type: 'default',
        icon: <Bell className="w-5 h-5 text-[#ff9900]" />,
        title: 'Push-Benachrichtigungen',
        info: 'Erhalte wichtige Festival-Infos direkt aufs Gerät.',
        switchElement: (
          <Button
            onClick={handleSubscribe}
            disabled={isLoading || !deviceId}
            size="sm"
            className="bg-[#ff9900] hover:bg-orange-600 text-white"
          >
            {isLoading ? 'Aktiviere...' : 'Erlauben'}
          </Button>
        ),
        disabled: false
      };
    }

    // browserPermission === 'granted'
    return {
      type: 'granted',
      icon: <Bell className="w-5 h-5 text-[#ff9900]" />,
      title: 'Push-Benachrichtigungen',
      info: 'Erhalte wichtige Festival-Infos direkt aufs Gerät.',
      switchElement: (
        <Switch
          checked={isSubscribed}
          onCheckedChange={isSubscribed ? handleUnsubscribe : handleSubscribe}
          disabled={isLoading || !deviceId}
        />
      ),
      disabled: false
    };
  };

  const uiState = getUIState();

  return (
    <>
    <UserSettingsCard
        icon={uiState.icon}
        title={uiState.title}
        switchElement={uiState.switchElement}
        info={uiState.info}
        variant={variant}
      />

      {/* Fehler-Anzeige */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
    </>
  );
}
