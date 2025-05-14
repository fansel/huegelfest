'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSignupOpen, setSignupOpen as setSignupOpenAction } from '@/features/globalState/actions/globalStateActions';
import { useWebSocket, WebSocketMessage } from '@/shared/hooks/useWebSocket';
import { getWebSocketUrl } from '@/shared/utils/getWebSocketUrl';

interface GlobalStateContextProps {
  signupOpen: boolean;
  setSignupOpen: (open: boolean) => Promise<void>;
}

const GlobalStateContext = createContext<GlobalStateContextProps | undefined>(undefined);

export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [signupOpen, setSignupOpenState] = useState(false);

  // Initial fetch
  useEffect(() => {
    getSignupOpen().then(setSignupOpenState);
  }, []);

  // WebSocket-Updates
  useWebSocket(
    getWebSocketUrl(),
    {
      onMessage: (msg: WebSocketMessage) => {
        if (msg.topic === 'globalState' && typeof (msg.payload as any).signupOpen === 'boolean') {
          setSignupOpenState((msg.payload as { signupOpen: boolean }).signupOpen);
        }
      },
      reconnectIntervalMs: 5000,
    }
  );

  // Setter, der auch die Action triggert
  const setSignupOpen = async (open: boolean) => {
    await setSignupOpenAction(open);
    // Optimistisch updaten (optional)
    setSignupOpenState(open);
  };

  return (
    <GlobalStateContext.Provider value={{ signupOpen, setSignupOpen }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export function useGlobalState() {
  const ctx = useContext(GlobalStateContext);
  if (!ctx) throw new Error('useGlobalState must be used within GlobalStateProvider');
  return ctx;
} 