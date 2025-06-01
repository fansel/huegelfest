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
import { env } from 'next-runtime-env';
import { toast } from 'react-hot-toast';

const VAPID_PUBLIC_KEY = env('NEXT_PUBLIC_VAPID_PUBLIC_KEY');

interface AutoPushPromptProps {
  forceShow?: boolean;
  onClose?: () => void;
  onSubscriptionChange?: (isSubscribed: boolean) => void;
}

export default function AutoPushPrompt({ forceShow = false, onClose, onSubscriptionChange }: AutoPushPromptProps) {
  const deviceId = useDeviceId();
  const [showPrompt, setShowPrompt] = useState(forceShow);
  const [isLoading, setIsLoading] = useState(false);
  const [triggerReason, setTriggerReason] = useState<string>('manual');
  const [customMessage, setCustomMessage] = useState<string | null>(null);

  // Nur bei forceShow oder manuellen Triggers anzeigen
  useEffect(() => {
    setShowPrompt(forceShow);
  }, [forceShow]);

  // Event-Listener für manuelle Triggers
  useEffect(() => {
    const handleTriggerPushPrompt = (event: CustomEvent) => {
      console.log('[AutoPushPrompt] Manueller Trigger erhalten:', event.detail);
      setTriggerReason(event.detail?.reason || 'manual');
      setCustomMessage(event.detail?.message || null);
      setShowPrompt(true);
    };

    window.addEventListener('triggerPushPrompt', handleTriggerPushPrompt as EventListener);
    
    return () => {
      window.removeEventListener('triggerPushPrompt', handleTriggerPushPrompt as EventListener);
    };
  }, []);

  const handleAllow = async () => {
    if (!deviceId) {
      toast.error('Device ID nicht verfügbar');
      return;
    }

    setIsLoading(true);

    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push-Benachrichtigungen werden von diesem Browser nicht unterstützt');
      }

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        let pushSubscription = await registration.pushManager.getSubscription();
        
        if (!pushSubscription) {
          pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: VAPID_PUBLIC_KEY
          });
        }

        const p256dhKey = pushSubscription.getKey('p256dh');
        const authKey = pushSubscription.getKey('auth');
        const p256dh = p256dhKey
          ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey))))
          : '';
        const auth = authKey
          ? btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey))))
          : '';

        const result = await subscribePushAction({
          endpoint: pushSubscription.endpoint,
          keys: { p256dh, auth },
          deviceId
        });

        if (result.status === 'success') {
          toast.success('Push-Benachrichtigungen aktiviert! 🔔');
          onSubscriptionChange?.(true);
          setShowPrompt(false);
          onClose?.();
        } else {
          throw new Error(result.message || 'Fehler beim Speichern der Subscription');
        }
      } else if (permission === 'denied') {
        onSubscriptionChange?.(false);
        setShowPrompt(false);
        onClose?.();
        toast.error('Push-Benachrichtigungen wurden abgelehnt');
      } else {
        // Permission ist 'default' - User hat abgebrochen
        setShowPrompt(false);
        onClose?.();
      }
    } catch (error) {
      console.error('[AutoPushPrompt] Fehler beim Aktivieren:', error);
      toast.error('Fehler beim Aktivieren der Push-Benachrichtigungen');
      onSubscriptionChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = () => {
    onSubscriptionChange?.(false);
    setShowPrompt(false);
    onClose?.();
  };

  if (!showPrompt || !deviceId) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={(open) => {
      if (!open) {
        handleDeny();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#ff9900]" />
            Benachrichtigungen erlauben?
          </DialogTitle>
          <DialogDescription>
            {customMessage || (
              triggerReason === 'device-transfer'
                ? 'Nach dem Gerätewechsel musst du Push-Benachrichtigungen neu aktivieren.'
                : triggerReason === 'first-start'
                ? 'Soll die App dir wichtige Updates als Push-Benachrichtigungen senden?'
                : 'Möchtest du Benachrichtigungen über wichtige Updates erhalten?'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Du erhältst Benachrichtigungen über:</strong></p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Neue Ankündigungen</li>
              <li> Deine Aufgaben</li>
              <li>Timeline-Updates</li>
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

            <Button
              variant="outline"
              onClick={handleDeny}
              disabled={isLoading}
              className="w-full"
            >
              <BellOff className="w-4 h-4 mr-2" />
              Nein danke
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 