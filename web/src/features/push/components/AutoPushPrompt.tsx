'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Bell } from 'lucide-react';
import { usePushSubscription } from '../hooks/usePushSubscription';
import { toast } from 'react-hot-toast';

interface AutoPushPromptProps {
  forceShow?: boolean;
  onClose?: () => void;
  onSubscriptionChange?: (subscribed: boolean) => void;
  isTemporarySession?: boolean;
}

export default function AutoPushPrompt({ forceShow = false, onClose, onSubscriptionChange, isTemporarySession = false }: AutoPushPromptProps) {
  const { isSubscribed, isLoading, isSupported, subscribe } = usePushSubscription();
  const [showPrompt, setShowPrompt] = useState(forceShow);
  const [triggerReason, setTriggerReason] = useState<string>('manual');
  const [customMessage, setCustomMessage] = useState<string | null>(null);

  // Check on mount if we should prompt the user
  useEffect(() => {
    if (forceShow || isTemporarySession) return;

    // Don't show if already subscribed, not supported, or permission isn't 'default'
    if (isSubscribed || !isSupported || Notification.permission !== 'default') {
      return;
    }
    
    // Check if we've already asked
    const hasAskedForPermission = localStorage.getItem('push-permission-asked') === 'true';
    if (!hasAskedForPermission) {
      setShowPrompt(true);
    }
  }, [isSubscribed, isSupported, forceShow, isTemporarySession]);
  
  // Event-Listener for manual triggers
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
    // Mark that we've asked for permission
    localStorage.setItem('push-permission-asked', 'true');
    
    const success = await subscribe();
    if (success) {
      toast.success('Push-Benachrichtigungen aktiviert! 🔔');
    }
    onSubscriptionChange?.(success);
    setShowPrompt(false);
    onClose?.();
  };

  const handleDeny = () => {
    // Mark that we've asked for permission so we don't bother the user again
    localStorage.setItem('push-permission-asked', 'true');
    onSubscriptionChange?.(false);
    setShowPrompt(false);
    onClose?.();
  };

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