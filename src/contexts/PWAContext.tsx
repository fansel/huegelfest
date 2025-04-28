'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PWAContextType {
  isPWA: boolean;
  isStandalone: boolean;
  isMobile: boolean;
}

// Initialisiere den Context mit Standardwerten
const PWAContext = createContext<PWAContextType>({
  isPWA: false,
  isStandalone: false,
  isMobile: false
});

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isPWA, setIsPWA] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // PWA Erkennung
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone || 
                           document.referrer.includes('android-app://');
    
    // Mobile Erkennung
    const isMobileDevice = window.matchMedia('(max-width: 768px)').matches;
    
    setIsPWA(isStandaloneMode);
    setIsStandalone(isStandaloneMode);
    setIsMobile(isMobileDevice);

    // Event Listener für Display Mode Änderungen
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsPWA(e.matches);
      setIsStandalone(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <PWAContext.Provider value={{ isPWA, isStandalone, isMobile }}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
} 