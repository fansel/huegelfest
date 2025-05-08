"use client";
import React, { useEffect, useState } from "react";

const BETA_KEY = "beta_stampcard";

export default function BetaSettings() {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem(BETA_KEY);
    setEnabled(stored === "true");
  }, []);

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    localStorage.setItem(BETA_KEY, newValue ? "true" : "false");
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <span className="text-[#ff9900] font-medium">Beta: Digitale Stempelkarte</span>
          <span className="text-[#ff9900]/60 text-sm">Teste das neue Stempel-Feature (Pattern-Scan, Sammelkarte)</span>
        </div>
        <div className="flex items-center gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              onChange={handleToggle}
            />
            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff9900] hover:bg-gray-300"></div>
          </label>
        </div>
      </div>
    </div>
  );
} 