import { useState, useEffect } from 'react';
import styles from './MusicNote.module.css';

interface MusicNoteProps {
  isActive: boolean;
  onClick: () => void;
}

export default function MusicNote({ isActive, onClick }: MusicNoteProps) {
  const [currentTrack, setCurrentTrack] = useState<{ title: string; author: string; url: string; html: string } | null>(null);
  const [musicUrls, setMusicUrls] = useState<string[]>([]);

  useEffect(() => {
    const loadMusicUrls = async () => {
      try {
        const response = await fetch('/api/music');
        if (!response.ok) throw new Error('Fehler beim Laden der Musik-URLs');
        const urls = await response.json();
        setMusicUrls(urls);
      } catch (error) {
        console.error('Fehler beim Laden der Musik-URLs:', error);
      }
    };

    loadMusicUrls();
  }, []);

  useEffect(() => {
    if (!isActive) {
      setCurrentTrack(null);
      return;
    }

    const playRandomTrack = async () => {
      if (musicUrls.length === 0) return;

      const randomUrl = musicUrls[Math.floor(Math.random() * musicUrls.length)];
      try {
        const response = await fetch('/api/soundcloud', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: randomUrl }),
        });

        if (!response.ok) throw new Error('Fehler beim Laden der Track-Informationen');
        const trackInfo = await response.json();

        setCurrentTrack({
          title: trackInfo.title,
          author: trackInfo.author_name,
          url: trackInfo.url,
          html: trackInfo.html
        });
      } catch (error) {
        console.error('Fehler beim Laden des Tracks:', error);
      }
    };

    playRandomTrack();
  }, [isActive, musicUrls]);

  return (
    <div className="relative">
      <button 
        onClick={onClick}
        className={`${styles.musicNoteButton} ${isActive ? styles.active : styles.inactive}`}
        aria-label={isActive ? "Musik deaktivieren" : "Musik aktivieren"}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className={styles.musicNoteIcon}
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </button>
      {isActive && currentTrack && (
        <div className="fixed bottom-4 right-4 z-50 w-[300px]">
          <iframe
            width="100%"
            height="300"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(currentTrack.url)}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
          />
        </div>
      )}
    </div>
  );
} 