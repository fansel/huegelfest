'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Context für die globale Festival-Anmeldephase.
 * Wenn aktiv, wird die App für nicht eingeloggte Nutzer stark eingeschränkt angezeigt.
 * Admins können lokal in eine User-Preview wechseln.
 */
export interface FestivalSignupPhaseContextProps {
  isSignupPhase: boolean;
  setSignupPhase: (active: boolean) => void;
  isAdminPreview: boolean;
  setAdminPreview: (active: boolean) => void;
}

const FestivalSignupPhaseContext = createContext<FestivalSignupPhaseContextProps | undefined>(undefined);

interface FestivalSignupPhaseProviderProps {
  children: ReactNode;
}

export const FestivalSignupPhaseProvider: React.FC<FestivalSignupPhaseProviderProps> = ({ children }) => {
  const [isSignupPhase, setSignupPhase] = useState<boolean>(false);
  // Admin kann lokal in die User-Preview wechseln
  const [isAdminPreview, setAdminPreview] = useState<boolean>(false);

  return (
    <FestivalSignupPhaseContext.Provider
      value={{ isSignupPhase, setSignupPhase, isAdminPreview, setAdminPreview }}
    >
      {children}
    </FestivalSignupPhaseContext.Provider>
  );
};

/**
 * Custom Hook für den Zugriff auf den FestivalSignupPhaseContext
 */
export function useFestivalSignupPhase(): FestivalSignupPhaseContextProps {
  const context = useContext(FestivalSignupPhaseContext);
  if (!context) {
    throw new Error('useFestivalSignupPhase muss innerhalb eines FestivalSignupPhaseProvider verwendet werden');
  }
  return context;
} 