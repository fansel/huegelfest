'use client';

import { useState, useEffect } from 'react';
import InfoBoard from '@/client/components/InfoBoard';
import { usePWA } from '@/contexts/PWAContext';

export default function InfoBoardPage() {
  const { isPWA } = usePWA();

  return (
    <div className="w-full">
      <InfoBoard isPWA={isPWA} />
    </div>
  );
} 