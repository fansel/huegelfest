"use client";
import { useEffect } from "react";
import { updateService } from "@/lib/updateService";
import { logger } from "@/lib/logger";

/**
 * PWA Service Worker Registrierung - Vollautomatische Update-Erkennung
 * Koordiniert mit UpdateService für nahtlose Updates
 */
export const PWARegister = (): null => {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Service Worker registrieren
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          logger.info("[PWA] ✅ Service Worker erfolgreich registriert");
          
          // Sofortige Update-Prüfung nach Registrierung
          registration.update();
          
          // Update-Behandlung über UpdateService
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              logger.info("[PWA] 🔄 Neue Service Worker Version wird installiert...");
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // Update verfügbar - sofort über UpdateService behandeln
                    logger.info("[PWA] ✨ Service Worker Update automatisch erkannt");
                    
                    // Benachrichtige UpdateService über Service Worker Update
                    updateService.handleWebSocketMessage({
                      topic: 'app-update-available',
                      payload: {
                        serviceWorkerUpdate: true,
                        appUpdate: false,
                        assetUpdate: true
                      }
                    });
                  } else {
                    // Erste Installation
                    logger.info("[PWA] 🎉 Service Worker zum ersten Mal installiert");
                  }
                }
              });
            }
          });
          
          // Service Worker Controller Change - Neue Version aktiv
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            logger.info("[PWA] 🔄 Service Worker Controller gewechselt - neue Version aktiv");
            // UpdateService übernimmt das Reload
          });

          // Regelmäßige Update-Checks alle 60 Sekunden
          setInterval(() => {
            registration.update();
          }, 60000);
          
        })
        .catch((err) => {
          logger.error("[PWA] ❌ Service Worker Registrierung fehlgeschlagen:", err);
        });

      // Zusätzlicher Check bei Tab-Focus (wenn User zurück zur App kommt)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          navigator.serviceWorker.getRegistration()
            .then(registration => {
              if (registration) {
                registration.update();
                logger.debug("[PWA] Update-Check bei Tab-Focus");
              }
            });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  return null;
}; 