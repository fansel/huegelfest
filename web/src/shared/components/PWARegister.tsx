"use client";
import { useEffect } from "react";

/**
 * Registriert den Service Worker für die PWA-Funktionalität.
 * Wird ganz oben im Body eingebunden.
 */
export const PWARegister = (): null => {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => {
          // Logging für Debugging
          console.error("[PWA] Service Worker konnte nicht registriert werden:", err);
        });
    }
  }, []);
  return null;
}; 