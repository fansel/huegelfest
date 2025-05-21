'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface UISettingsContextProps {
  showStarfield: boolean;
  setShowStarfield: (value: boolean) => void;
  showMusicNote: boolean;
  setShowMusicNote: (value: boolean) => void;
}

const UISettingsContext = createContext<UISettingsContextProps | undefined>(undefined);

const STARFIELD_KEY = 'showStarfield';
const MUSICNOTE_KEY = 'showMusicNote';

export const UISettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showStarfield, setShowStarfieldState] = useState<boolean>(true);
  const [showMusicNote, setShowMusicNoteState] = useState<boolean>(true);

  // Initialwert aus LocalStorage laden
  useEffect(() => {
    const stored = localStorage.getItem(STARFIELD_KEY);
    if (stored !== null) {
      setShowStarfieldState(stored === 'true');
    }
    const musicNoteStored = localStorage.getItem(MUSICNOTE_KEY);
    if (musicNoteStored !== null) {
      setShowMusicNoteState(musicNoteStored === 'true');
    }
  }, []);

  // Bei Änderung in LocalStorage speichern
  useEffect(() => {
    localStorage.setItem(STARFIELD_KEY, String(showStarfield));
  }, [showStarfield]);

  useEffect(() => {
    localStorage.setItem(MUSICNOTE_KEY, String(showMusicNote));
  }, [showMusicNote]);

  const setShowStarfield = (value: boolean) => {
    setShowStarfieldState(value);
  };

  const setShowMusicNote = (value: boolean) => {
    setShowMusicNoteState(value);
  };

  return (
    <UISettingsContext.Provider value={{ showStarfield, setShowStarfield, showMusicNote, setShowMusicNote }}>
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