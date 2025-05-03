'use client';

import dynamic from 'next/dynamic';

const MusicNoteContainer = dynamic(() => import('@/components/MusicNoteContainer'), {
  ssr: false,
});

export default function ClientMusicNoteContainer() {
  return <MusicNoteContainer />;
}
