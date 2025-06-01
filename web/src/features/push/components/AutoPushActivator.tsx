'use client';

import { useEffect } from 'react';
import { usePushSubscription } from '../hooks/usePushSubscription';
import { useDeviceId } from '@/shared/hooks/useDeviceId';

/**
 * Komponente für automatische Push-Aktivierung nach Gerätewechsel
 * Wird automatisch auf der Root-Ebene der App eingebunden
 */
export default function AutoPushActivator() {
  const deviceId = useDeviceId();
  const { autoActivateIfPermissionGranted, isSupported } = usePushSubscription();

  useEffect(() => {
    if (!deviceId || !isSupported) return;

    // Prüfe beim App-Start ob Device-Transfer stattgefunden hat
    const checkDeviceTransfer = () => {
      const hasDeviceTransfer = localStorage.getItem('device-transfer-completed');
      
      if (hasDeviceTransfer) {
        console.log('[AutoPushActivator] Device-Transfer erkannt - starte automatische Push-Aktivierung');
        
        // Kleine Verzögerung damit die App vollständig geladen ist
        setTimeout(() => {
          autoActivateIfPermissionGranted();
        }, 1000);
      }
    };

    // Prüfe sowohl beim Mount als auch bei Fokus-Änderungen
    checkDeviceTransfer();

    // Zusätzlich bei Visibility Change (wenn User zur App zurückkehrt)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkDeviceTransfer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [deviceId, isSupported, autoActivateIfPermissionGranted]);

  // Diese Komponente rendert nichts - sie ist nur für die Logik da
  return null;
} 