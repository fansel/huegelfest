'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Bell, BellOff, X } from 'lucide-react';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { subscribePushAction } from '../actions/subscribePush';
import { checkSubscription } from '../actions/checkSubscription';
import { pushPermissionUtils } from '../../settings/components/PushNotificationSettings';
import { env } from 'next-runtime-env';
import { toast } from 'react-hot-toast';

const VAPID_PUBLIC_KEY = env('NEXT_PUBLIC_VAPID_PUBLIC_KEY');

interface AutoPushPromptProps {
  // Trigger für manuelles Anzeigen (z.B. nach Device Transfer)
  forceShow?: boolean;
  onClose?: () => void;
  // NEU: Callback um Parent über erfolgreiche Subscription zu informieren
  onSubscriptionChange?: (isSubscribed: boolean) => void;
}

export default function AutoPushPrompt({ forceShow = false, onClose, onSubscriptionChange }: AutoPushPromptProps) {
  const deviceId = useDeviceId();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkShouldPrompt = async () => {
      // Force Show (z.B. nach Device Transfer)
      if (forceShow) {
        setShowPrompt(true);
        return;
      }

      // Automatischer Check beim App-Start
      if (!deviceId) return;

      // Prüfe erst ob bereits eine Subscription existiert
      try {
        const { exists } = await checkSubscription(deviceId);
        if (exists) {
          // User hat bereits Push aktiviert, kein Prompt nötig
          return;
        }
      } catch (error) {
        console.error('Fehler beim Prüfen der Subscription:', error);
      }

      // Prüfe Browser-Support
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return;
      }

      // Prüfe aktuelle Permission
      const currentPermission = Notification.permission;
      
      // Wenn bereits granted oder denied, und User schon mal gefragt wurde
      if (currentPermission !== 'default' && pushPermissionUtils.hasAskedBefore()) {
        return;
      }

      // Warte kurz um störende Prompts zu vermeiden (nur beim App-Start)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Zeige Prompt wenn noch nie gefragt wurde oder bei Force-Show
      if (!pushPermissionUtils.hasAskedBefore()) {
        setShowPrompt(true);
      }
    };

    checkShouldPrompt();
  }, [deviceId, forceShow]);

  const handleAllow = async () => {
    if (!deviceId) {
      toast.error('Device ID nicht verfügbar');
      return;
    }

    setIsLoading(true);

    try {
      // iOS-kompatibel: Permission muss durch User-Geste ausgelöst werden
      // Das passiert hier durch den Button-Click
      
      // Prüfe Browser-Support
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push-Benachrichtigungen werden von diesem Browser nicht unterstützt');
      }

      // Permission anfragen (iOS-kompatibel durch User-Geste)
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Service Worker bereit machen
        const registration = await navigator.serviceWorker.ready;
        
        // Prüfe ob bereits eine Subscription existiert
        let pushSubscription = await registration.pushManager.getSubscription();
        
        if (!pushSubscription) {
          // Neue Push Subscription erstellen
          pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: VAPID_PUBLIC_KEY
          });
        }

        // Keys extrahieren
        const p256dhKey = pushSubscription.getKey('p256dh');
        const authKey = pushSubscription.getKey('auth');
        const p256dh = p256dhKey
          ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey))))
          : '';
        const auth = authKey
          ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey))))
          : '';

        // WICHTIG: Nutze den normalen subscribePushAction Endpunkt
        const result = await subscribePushAction({
          endpoint: pushSubscription.endpoint,
          keys: { p256dh, auth },
          deviceId
        });

        // subscribePushAction gibt { status: string, message: string } zurück
        if (result.status === 'success') {
          pushPermissionUtils.setAskedBefore();
          toast.success('Push-Benachrichtigungen aktiviert! 🔔');
          
          // Informiere Parent Component über erfolgreiche Subscription
          onSubscriptionChange?.(true);
          
          // NEU: Sende Custom Event für andere Komponenten (z.B. PushNotificationSettings)
          window.dispatchEvent(new CustomEvent('pushSubscriptionChanged', { detail: { isSubscribed: true } }));
          
          setShowPrompt(false);
          onClose?.();
        } else {
          throw new Error(result.message || 'Fehler beim Speichern der Subscription');
        }
      } else if (permission === 'denied') {
        pushPermissionUtils.setDenied();
        onSubscriptionChange?.(false);
        setShowPrompt(false);
        onClose?.();
        toast.error('Push-Benachrichtigungen wurden abgelehnt');
      } else {
        // Default - User hat abgebrochen
        setShowPrompt(false);
        onClose?.();
      }
    } catch (error) {
      console.error('Fehler beim Aktivieren der Push-Benachrichtigungen:', error);
      toast.error('Fehler beim Aktivieren der Push-Benachrichtigungen');
      pushPermissionUtils.setAskedBefore();
      onSubscriptionChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = () => {
    pushPermissionUtils.setDenied();
    onSubscriptionChange?.(false);
    setShowPrompt(false);
    onClose?.();
  };

  const handleLater = () => {
    // Bei "Später" nicht als "gefragt" markieren - wird beim nächsten App-Start wieder gefragt
    // Nur bei Force-Show (Device Transfer) nicht wieder fragen
    if (forceShow) {
      pushPermissionUtils.setAskedBefore();
    }
    setShowPrompt(false);
    onClose?.();
  };

  // Zeige Dialog nur wenn alle Bedingungen erfüllt sind
  if (!showPrompt || !deviceId) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={(open) => {
      if (!open) {
        handleLater();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#ff9900]" />
            Benachrichtigungen erlauben?
          </DialogTitle>
          <DialogDescription>
            {forceShow 
              ? 'Nach dem Gerätewechsel musst du Push-Benachrichtigungen neu aktivieren.'
              : 'Möchtest du Benachrichtigungen über wichtige Updates erhalten?'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Du erhältst Benachrichtigungen über:</strong></p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Neue Ankündigungen</li>
              <li>Timeline-Updates</li>
              <li>Wichtige Informationen</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleAllow}
              disabled={isLoading}
              className="w-full bg-[#ff9900] hover:bg-orange-600"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Aktiviere...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Ja, Benachrichtigungen erlauben
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDeny}
                disabled={isLoading}
                className="flex-1"
              >
                <BellOff className="w-4 h-4 mr-2" />
                Nein danke
              </Button>
              
              {!forceShow && (
                <Button
                  variant="outline"
                  onClick={handleLater}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Später fragen
                </Button>
              )}
            </div>
          </div>

          {/* iOS-spezifischer Hinweis */}
          <div className="text-xs text-gray-500 text-center">
            💡 Auf iOS: Tippe "Erlauben" und dann nochmal "Erlauben" im Browser-Dialog
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 