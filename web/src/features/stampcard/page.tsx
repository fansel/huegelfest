import React from "react";
import { StampCard } from "./components/StampCard";
import { PatternScanner } from "./components/PatternScanner";
import { useStampCard } from "./hooks/useStampCard";

/**
 * Seite für die digitale Stempelkarte.
 * Zeigt die gesammelten Stempel und den Pattern-Scanner.
 */
export default function StampCardPage() {
  const { collectedStamps, loading, error } = useStampCard();

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-blue-100 to-white p-4">
      <div className="w-full max-w-md mt-8">
        <StampCard collectedStamps={collectedStamps} />
        <PatternScanner />
        {loading && <p className="text-gray-400 mt-2">Lade Stempel...</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </main>
  );
} 