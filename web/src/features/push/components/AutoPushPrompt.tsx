'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Bell, X } from 'lucide-react';
import { subscribePushAction } from '../actions/subscribePush';
import { env } from 'next-runtime-env';
import { toast } from 'react-hot-toast';

const VAPID_PUBLIC_KEY = env('NEXT_PUBLIC_VAPID_PUBLIC_KEY');

interface AutoPushPromptProps {
  forceShow?: boolean;
  onClose?: () => void;
  onSubscriptionChange?: (subscribed: boolean) => void;
}

export default function AutoPushPrompt({ forceShow = false, onClose, onSubscriptionChange }: AutoPushPromptProps) {
  const { user } = useAuth(); 
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
    if (!user) {
      toast.error('Benutzer nicht angemeldet');
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
          keys: { p256dh, auth }
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

  if (!showPrompt || !user) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={(open) => {
      if (!open) {
        handleDeny();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push-Benachrichtigungen
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {customMessage || 'Möchtest du Benachrichtigungen über wichtige Ereignisse erhalten?'}
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={handleAllow}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Aktiviere...' : 'Aktivieren'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDeny}
              disabled={isLoading}
              className="flex-1"
            >
              Nicht jetzt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 