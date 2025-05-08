"use client";
import React from "react";
import { StampBadge } from "./StampBadge";

export interface StampCardProps {
  collectedStamps: string[]; // z.B. ["nachteule"]
}

/**
 * Zeigt die digitale Stempelkarte als Grid an.
 * Aktuell nur der Nachteule-Stempel.
 */
export const StampCard: React.FC<StampCardProps> = ({ collectedStamps }) => {
  const isNachteuleCollected = collectedStamps.includes("nachteule");

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold">Deine Stempelkarte</h2>
      <div className="grid grid-cols-3 gap-6 p-4 bg-white rounded-xl shadow-md">
        <div className="flex flex-col items-center">
          <StampBadge collected={isNachteuleCollected} />
          <span className="mt-2 text-sm">Nachteule</span>
        </div>
        {/* Platz für weitere Stempel */}
      </div>
      <p className="text-gray-500 text-xs mt-2">Sammle Stempel, indem du Patterns scannst!</p>
    </div>
  );
}; 