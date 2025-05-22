"use client";
import React, { useEffect, useState } from "react";
import { useDeviceContext } from "@/shared/contexts/DeviceContext";
import { AlertTriangle, ShareIcon} from 'lucide-react';

interface InstallPromptProps {}

// Hilfsfunktion zur Plattform-Erkennung
function getMobilePlatform(): "ios" | "android" | null {
  if (typeof window === "undefined") return null;
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return null;
}

const LOCAL_STORAGE_KEY = "install_prompt_hidden";

export const InstallPrompt: React.FC<InstallPromptProps> = () => {
  const { deviceType, displayMode } = useDeviceContext();
  const [show, setShow] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "unknown" | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (deviceType !== "mobile" || displayMode === "standalone") {
      setShow(false);
      return;
    }
    const hidden = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (hidden === "1") {
      setShow(false);
      return;
    }
    const detected = getMobilePlatform();
    setPlatform(detected ?? "unknown");
    setShow(true);
  }, [deviceType, displayMode]);

  useEffect(() => { setIsClient(true); }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(LOCAL_STORAGE_KEY, "1");
    }
    setShow(false);
  };

  if (!isClient || !show || platform === null) return null;

  // Warn-Design: gelber Rahmen, Warn-Icon, freundlicher Text
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="bg-white border-2 border-yellow-400 rounded-xl shadow-xl max-w-sm w-full p-6 text-[#460b6c] relative">
        <div className="flex items-center mb-2">
          <AlertTriangle className="text-yellow-500 mr-2" size={28} />
          <h2 className="text-lg font-bold text-yellow-700">Hinweis zur App-Installation</h2>
        </div>
        <div className="mb-3 text-sm text-gray-800">
          <p className="mb-2">Um das Hügelfest als App zu nutzen, installiere sie bitte auf deinem Startbildschirm. So hast du die beste Nutzererfahrung – auch offline!</p>
        </div>
        {platform === "ios" ? (
          <ol className="list-decimal pl-5 mb-3 text-sm">
            <li>Tippe unten im Browser auf <span className="font-semibold">Teilen</span> <ShareIcon className="inline align-text-bottom ml-1" size={18} />
            </li>
            <li>Wähle <span className="font-semibold">"Zum Home-Bildschirm"</span> aus</li>
            <li>Bestätige die Installation</li>
          </ol>
        ) : platform === "android" || platform === "unknown" ? (
          <ol className="list-decimal pl-5 mb-3 text-sm">
            <li>Tippe oben rechts im Browser-Menü <span className="font-semibold">⋮</span></li>
            <li>Wähle <span className="font-semibold">"App installieren"</span> oder <span className="font-semibold">"Zum Startbildschirm"</span></li>
            <li>Bestätige die Installation</li>
          </ol>
        ) : null}
        <div className="mb-2 text-xs text-gray-700">
          <p>Hast du das gemacht, kannst du diese Seite schließen.</p>
          <p className="mt-1">Öffnet sich die Website weiterhin im Browser, ist dein System vermutlich zu alt.</p>
        </div>
        <label className="flex items-center gap-2 text-xs mb-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={e => setDontShowAgain(e.target.checked)}
            className="accent-[#ff9900]"
          />
          Diese Warnung nicht mehr anzeigen
        </label>
        <button
          className="w-full py-2 rounded bg-yellow-400 text-[#460b6c] font-semibold hover:bg-yellow-500 transition border border-yellow-500"
          onClick={handleClose}
        >
          Verstanden
        </button>
      </div>
    </div>
  );
}; 