"use client";
import { useEffect } from "react";

/**
 * PWA Service Worker Registrierung - Einfach und bewährt
 * Fokus auf statische Assets, SWR übernimmt Daten-Caching
 */
export const PWARegister = (): null => {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Service Worker registrieren
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] ✅ Service Worker erfolgreich registriert");
          
          // Einfache Update-Behandlung
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              console.log("[PWA] 🔄 Neue Service Worker Version wird installiert...");
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // Update verfügbar - automatisch anwenden
                    console.log("[PWA] ✨ Neue Version verfügbar - wird automatisch angewendet");
                    
                    setTimeout(() => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }, 2000);
                  } else {
                    // Erste Installation
                    console.log("[PWA] 🎉 Service Worker zum ersten Mal installiert");
                  }
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error("[PWA] ❌ Service Worker Registrierung fehlgeschlagen:", err);
        });
    }
  }, []);

  return null;
}; 