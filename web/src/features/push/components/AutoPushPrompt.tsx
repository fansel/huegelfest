'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Bell } from 'lucide-react';
import { subscribePushAction } from '../actions/subscribePush';
import { env } from 'next-runtime-env';
import { toast } from 'react-hot-toast';
import { PushStateManager } from '../utils/pushStateManager';

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

  // Prüfe beim ersten App-Start ob Berechtigung angefragt werden soll
  useEffect(() => {
    const hasAskedForPermission = localStorage.getItem('push-permission-asked') === 'true';
    const { supported, api } = PushStateManager.getNotificationAPI();
    
    if (!hasAskedForPermission && supported && api && api.permission === 'default') {
      console.log('[AutoPushPrompt] Zeige initiale Push-Abfrage');
      setShowPrompt(true);
    }
  }, []);

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
    setIsLoading(true);

    try {
      const { supported, api } = PushStateManager.getNotificationAPI();
      
      if (!supported || !api) {
        throw new Error('Push-Benachrichtigungen werden von diesem Browser nicht unterstützt');
      }

      const permission = await api.requestPermission();
      
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

        // Speichere die Subscription - mit oder ohne User
        const result = await subscribePushAction({
          endpoint: pushSubscription.endpoint,
          keys: { p256dh, auth }
        });

        if (result.status === 'success') {
          localStorage.setItem('push-permission-asked', 'true');
          toast.success('Push-Benachrichtigungen aktiviert! 🔔');
          onSubscriptionChange?.(true);
          setShowPrompt(false);
          onClose?.();
        } else {
          throw new Error(result.message || 'Fehler beim Speichern der Subscription');
        }
      } else {
        localStorage.setItem('push-permission-asked', 'true');
        onSubscriptionChange?.(false);
        setShowPrompt(false);
        onClose?.();
        if (permission === 'denied') {
          toast.error('Push-Benachrichtigungen wurden abgelehnt');
        }
      }
    } catch (error) {
      console.error('[AutoPushPrompt] Fehler beim Aktivieren:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Aktivieren der Push-Benachrichtigungen');
      onSubscriptionChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = () => {
    localStorage.setItem('push-permission-asked', 'true');
    onSubscriptionChange?.(false);
    setShowPrompt(false);
    onClose?.();
  };

  // Zeige Dialog nur wenn showPrompt true ist
  if (!showPrompt) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={(open) => {
      if (!open) {
        handleDeny();
      }
    }}>
      <DialogContent className="bg-[#460b6c] border-[#ff9900]/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#ff9900]">
            <Bell className="h-5 w-5" />
            Push-Benachrichtigungen
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-[#ff9900]/80">
            {customMessage || 'Möchtest du Benachrichtigungen über wichtige Ereignisse erhalten?'}
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={handleAllow}
              disabled={isLoading}
              className="flex-1 bg-[#ff9900] text-[#460b6c] hover:bg-[#ff9900]/90 disabled:bg-[#ff9900]/50"
            >
              {isLoading ? 'Aktiviere...' : 'Aktivieren'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDeny}
              disabled={isLoading}
              className="flex-1 border-[#ff9900]/20 text-[#ff9900] hover:bg-[#ff9900]/10"
            >
              Nicht jetzt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 