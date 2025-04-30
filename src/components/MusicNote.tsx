'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './MusicNote.module.css';
import { FaPlay, FaPause, FaCompactDisc, FaForward, FaBackward } from 'react-icons/fa6';

interface Track {
  title: string;
  url: string;
  author_name?: string;
}

interface MusicNoteProps {
  onClick: () => void;
}

export default function MusicNote({ onClick }: MusicNoteProps) {
  const [track, setTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Lade Tracks
  useEffect(() => {
    console.log('[MusicNote] Starte Track-Ladung');
    fetch('/api/music')
      .then(res => {
        console.log('[MusicNote] API Response:', {
          status: res.status,
          ok: res.ok,
          type: res.type
        });
        return res.json();
      })
      .then(data => {
        console.log('[MusicNote] API Data:', data);
        const loadedTracks = data.map((item: any) => ({
          title: item.trackInfo.title,
          url: item.url,
          author_name: item.trackInfo.author_name
        }));
        setTracks(loadedTracks);
        setTrack(loadedTracks[0]);
      })
      .catch(e => console.error('[MusicNote] API Fehler:', e));
  }, []);

  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      setIsExpanded(!isExpanded);
      // Stärkeres haptisches Feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]); // Zwei Vibrationen mit Pause
      }
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsExpanded(!isExpanded);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const playNextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIndex);
    setTrack(tracks[nextIndex]);
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({
        method: 'load',
        value: tracks[nextIndex].url
      }), 'https://w.soundcloud.com');
      // Stärkeres haptisches Feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100); // Längere Vibration
      }
    }
  };

  const playPreviousTrack = () => {
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(prevIndex);
    setTrack(tracks[prevIndex]);
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({
        method: 'load',
        value: tracks[prevIndex].url
      }), 'https://w.soundcloud.com');
      // Stärkeres haptisches Feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100); // Längere Vibration
      }
    }
  };

  // Initialisiere Player
  useEffect(() => {
    if (!track) return;

    console.log('[MusicNote] Erstelle Player für:', track.url);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;opacity:0';
    iframe.allow = 'autoplay; encrypted-media';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
    
    const params = new URLSearchParams({
      url: track.url,
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'false',
      show_reposts: 'false',
      visual: 'true',
      show_artwork: 'true',
      show_playcount: 'false',
      show_teaser: 'false',
      single_active: 'true',
      buying: 'false',
      sharing: 'false',
      download: 'false',
      show_bpm: 'false',
      auto_play: 'false'
    });
    
    const playerURL = `https://w.soundcloud.com/player/?${params.toString()}`;
    console.log('[MusicNote] Player URL:', playerURL);
    
    iframe.src = playerURL;
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    // Event Listener für postMessages
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://w.soundcloud.com') return;
      
      try {
        const data = JSON.parse(event.data);
        console.log('[MusicNote] Player Message:', data);
        
        if (data.method === 'ready') {
          console.log('[MusicNote] Player Ready');
          // Setze initial Volume auf 0
          iframeRef.current?.contentWindow?.postMessage(JSON.stringify({
            method: 'setVolume',
            value: 0
          }), 'https://w.soundcloud.com');
        } else if (data.method === 'play') {
          console.log('[MusicNote] Player Play');
          // Nur setzen wenn nicht bereits gesetzt
          if (!isPlaying) {
            setIsPlaying(true);
          }
        } else if (data.method === 'pause') {
          console.log('[MusicNote] Player Pause');
          // Nur setzen wenn nicht bereits gesetzt
          if (isPlaying) {
                    setIsPlaying(false);
          }
        } else if (data.method === 'finish') {
          console.log('[MusicNote] Player Finish');
          setIsPlaying(false);
          if (track) {
            console.log('[MusicNote] Lade Track neu:', track.url);
            iframeRef.current?.contentWindow?.postMessage(JSON.stringify({
              method: 'load',
              value: track.url
            }), 'https://w.soundcloud.com');
          }
        }
      } catch (e) {
        console.error('[MusicNote] Message Parse Error:', e);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      console.log('[MusicNote] Cleanup');
      window.removeEventListener('message', handleMessage);
      if (iframeRef.current) {
        console.log('[MusicNote] Entferne Player');
        iframeRef.current.remove();
        iframeRef.current = null;
      }
    };
  }, [track]);

  const togglePlay = () => {
    console.log('[MusicNote] Toggle Play:', { isPlaying, hasPlayer: !!iframeRef.current });
    if (!iframeRef.current) {
      console.log('[MusicNote] Kein Player verfügbar');
      return;
    }
    
    // Setze den Zustand sofort
    setIsPlaying(!isPlaying);
    
    iframeRef.current.contentWindow?.postMessage(JSON.stringify({
      method: 'toggle'
    }), 'https://w.soundcloud.com');
    
    onClick();
  };

  console.log('[MusicNote] Render:', { track, isPlaying });

  return (
    <div className="relative">
      <button 
        onClick={togglePlay}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`${styles.musicNoteButton} ${isPlaying ? styles.active : styles.inactive} ${isExpanded ? styles.expanded : ''}`}
        aria-label={isPlaying ? 'Musik pausieren' : 'Musik abspielen'}
      >
        <FaCompactDisc 
          size={48} 
          className={isPlaying ? styles.spinning : styles.paused} 
        />
        {isExpanded && (
          <div className={styles.navigationControls}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                playPreviousTrack();
              }}
              className={styles.navButton}
            >
              <FaBackward size={24} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                playNextTrack();
              }}
              className={styles.navButton}
            >
              <FaForward size={24} />
            </button>
          </div>
        )}
      </button>
    </div>
  );
} 
