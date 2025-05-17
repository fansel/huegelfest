'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface UISettingsContextProps {
  showStarfield: boolean;
  setShowStarfield: (value: boolean) => void;
}

const UISettingsContext = createContext<UISettingsContextProps | undefined>(undefined);

const STARFIELD_KEY = 'showStarfield';

export const UISettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showStarfield, setShowStarfieldState] = useState<boolean>(true);

  // Initialwert aus LocalStorage laden
  useEffect(() => {
    const stored = localStorage.getItem(STARFIELD_KEY);
    if (stored !== null) {
      setShowStarfieldState(stored === 'true');
    }
  }, []);

  // Bei Änderung in LocalStorage speichern
  useEffect(() => {
    localStorage.setItem(STARFIELD_KEY, String(showStarfield));
  }, [showStarfield]);

  const setShowStarfield = (value: boolean) => {
    setShowStarfieldState(value);
  };

  return (
    <UISettingsContext.Provider value={{ showStarfield, setShowStarfield }}>
      {children}
    </UISettingsContext.Provider>
  );
};

export function useUISettings() {
  const context = useContext(UISettingsContext);
  if (!context) {
    throw new Error('useUISettings must be used within a UISettingsProvider');
  }
  return context;
} 