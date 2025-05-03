'use client';

import { useState } from 'react';
import MusicNote from './MusicNote';
import { useMusicPlayerStore } from '@/client/store/musicPlayerStore';

export default function MusicNoteContainer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const isEnabled = useMusicPlayerStore((state) => state.isEnabled);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isEnabled) {
    return null;
  }

  return <MusicNote onClick={handleClick} />;
}
