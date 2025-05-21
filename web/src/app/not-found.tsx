'use client';

import React, { useState } from 'react';
import Starfield from '@/shared/components/Starfield';
import Link from 'next/link';
import SpaceshipGame from '@/shared/components/ui/SpaceshipGame';

export default function NotFound() {
  const [started, setStarted] = useState(false);

  // Start bei erstem Tastendruck
  React.useEffect(() => {
    if (started) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        setStarted(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { once: true });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#460b6c] text-primary-foreground overflow-hidden">
      <Starfield />
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md p-8 animate-fade-in">
        {!started && (
          <>
            <h1 className="text-5xl font-bold mb-4 font-display text-primary">404</h1>
            <p className="text-lg mb-6 text-muted-foreground">Oops! Diese Seite existiert nicht.<br />Aber vielleicht findest du Spaß an unserem kleinen Minigame?</p>
            <div className="flex flex-col items-center gap-2 mt-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center border-2 border-[#ff9900] rounded bg-card font-mono text-xl text-[#ff9900]">↑</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center border-2 border-[#ff9900] rounded bg-card font-mono text-xl text-[#ff9900]">←</div>
                <div className="w-10 h-10 flex items-center justify-center border-2 border-[#ff9900] rounded bg-card font-mono text-xl text-[#ff9900]">↓</div>
                <div className="w-10 h-10 flex items-center justify-center border-2 border-[#ff9900] rounded bg-card font-mono text-xl text-[#ff9900]">→</div>
              </div>
              <span className="text-xs text-muted-foreground mt-2">Steuere das Raumschiff mit den Pfeiltasten</span>
            </div>
          </>
        )}
        <div className="w-full max-w-xs mx-auto">
          <SpaceshipGame started={started} />
        </div>
      </div>
    </div>
  );
}
