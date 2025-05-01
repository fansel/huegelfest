'use client';

import { useState } from 'react';
import MusicNote from './MusicNote';

export default function MusicNoteContainer() {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  return <MusicNote onClick={handleClick} />;
} 