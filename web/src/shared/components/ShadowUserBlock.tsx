import React from 'react';

interface ShadowUserBlockProps {
  isMobile?: boolean;
  className?: string;
}

export function ShadowUserBlock({ isMobile = false, className }: ShadowUserBlockProps) {
  const baseClasses = isMobile 
    ? `fixed left-0 right-0 bottom-0 top-0 flex flex-col bg-white overflow-hidden`
    : `min-h-screen bg-gray-50 flex items-center justify-center p-4`;
  
  const fullClasses = className ? `${baseClasses} ${className}` : baseClasses;
  
  return (
    <div className={fullClasses}>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[#ff9900] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">🔒</span>
          </div>
          <h2 className="font-semibold text-2xl text-[#460b6c] mb-2">Kein Zugang</h2>
          <p className="text-[#460b6c]/80 text-lg">
            Diese Seite ist für deinen Account-Typ nicht verfügbar.
          </p>
        </div>
      </div>
    </div>
  );
} 