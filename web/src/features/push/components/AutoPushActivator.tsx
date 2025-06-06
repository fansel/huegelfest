'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';

/**
 * Auto Push Activator - Automatische Push-Aktivierung nach bestimmten Events
 */
export default function AutoPushActivator() {
  const { user } = useAuth();
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    if (!user || isActivated) return;

    // Einfache Aktivierung beim App-Start für authentifizierte Benutzer
    setIsActivated(true);
  }, [user, isActivated]);

  // Diese Komponente rendert nichts - sie ist nur für die Logik da
  return null;
} 