"use client";
import React, { useEffect, useState } from "react";
import { useDeviceContext } from "@/shared/contexts/DeviceContext";
import { 
  AlertTriangle, 
  ShareIcon, 
  Smartphone, 
  CheckCircle2, 
  Timer, 
  FileCheck,
  MoreVertical
} from 'lucide-react';
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

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
  const [mounted, setMounted] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "unknown" | null>(null);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [canClose, setCanClose] = useState(true);

  // Hydration-sicherer Mount-Check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Logik für Anzeige-Entscheidung nur nach Mount
  useEffect(() => {
    if (!mounted) return;

    // Prüfungen für Anzeige
    if (typeof window === "undefined") return;
    if (deviceType !== "mobile") return;
    if (displayMode === "standalone") return;
    
    const hidden = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (hidden === "1") return;
    
    const detected = getMobilePlatform();
    if (!detected) return;
    
    setPlatform(detected);
    setShouldShow(true);
  }, [mounted, deviceType, displayMode]);

  const handleClose = () => {
    if (!hasReadInstructions) {
      toast.error('Bitte bestätige, dass du die Anleitung gelesen hast');
      return;
    }
    if (dontShowAgain) {
      localStorage.setItem(LOCAL_STORAGE_KEY, "1");
    }
    setShouldShow(false);
  };

  // Verhindere jedes Rendering vor vollständiger Hydration
  if (!mounted || !shouldShow || !platform) {
    return null;
  }

  return (
    <Dialog open={shouldShow} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-yellow-500 shrink-0" size={24} />
            <span className="text-yellow-700">Installation</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 text-sm text-gray-800">
          <div className="bg-yellow-50 p-3 rounded border-l-2 border-yellow-500">
            <p>Installiere die App auf deinem Startbildschirm für:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1 marker:text-yellow-500">
              <li>Offline-Zugriff</li>
              <li>Push-Benachrichtigungen</li>
              <li>Beste Performance</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-3 rounded border-l-2 border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="text-blue-500 shrink-0" size={16} />
              <p className="font-medium">Installation:</p>
            </div>
            {platform === "ios" ? (
              <ol className="list-decimal pl-6 space-y-2">
                <li className="pl-1">Tippe auf <span className="font-medium inline-flex items-center gap-1">Teilen <ShareIcon className="shrink-0" size={16} /></span></li>
                <li className="pl-1">Wähle <span className="font-medium">"Zum Home-Bildschirm"</span></li>
                <li className="pl-1">Bestätige die Installation</li>
              </ol>
            ) : platform === "android" || platform === "unknown" ? (
              <ol className="list-decimal pl-6 space-y-2">
                <li className="pl-1">Tippe auf <span className="font-medium inline-flex items-center"><MoreVertical className="shrink-0" size={16} /></span></li>
                <li className="pl-1">Wähle <span className="font-medium">"App installieren"</span></li>
                <li className="pl-1">Bestätige die Installation</li>
              </ol>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasReadInstructions}
                onChange={e => setHasReadInstructions(e.target.checked)}
                className="accent-[#ff9900] w-4 h-4"
              />
              <span className="text-sm">Ich habe die Anleitung verstanden</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
                className="accent-[#ff9900] w-4 h-4"
              />
              <span className="text-sm">Nicht mehr anzeigen</span>
            </label>
          </div>

          <button
            className={`w-full py-2 rounded text-sm font-medium transition border ${
              hasReadInstructions
                ? 'bg-yellow-400 text-[#460b6c] hover:bg-yellow-500 border-yellow-500'
                : 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
            }`}
            onClick={handleClose}
            disabled={!hasReadInstructions}
          >
            {!hasReadInstructions 
              ? <span className="inline-flex items-center gap-1"><FileCheck size={16} /> Bitte bestätigen</span>
              : <span className="inline-flex items-center gap-1"><CheckCircle2 size={16} /> Verstanden</span>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 