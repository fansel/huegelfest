"use client";
import { useEffect } from "react";
import { updateService } from "@/lib/updateService";

/**
 * Registriert den Service Worker für die PWA-Funktionalität.
 * Wird ganz oben im Body eingebunden.
 */
export const PWARegister = (): null => {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (registration) => {
          console.log("[PWA] Service Worker erfolgreich registriert");
          
          // Update-Service initialisieren
          await updateService.initialize();
          
          // Service Worker Update-Events lauschen
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log("[PWA] Neue Service Worker Version verfügbar");
                  // Update-Service wird automatisch benachrichtigen
                }
              });
            }
          });
        })
        .catch((err) => {
          // Logging für Debugging
          console.error("[PWA] Service Worker konnte nicht registriert werden:", err);
        });
    }

    // Cleanup beim Unmount
    return () => {
      updateService.destroy();
    };
  }, []);

  return null;
}; 