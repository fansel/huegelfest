'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './MusicNote.module.css';
import { FaCompactDisc, FaDice } from 'react-icons/fa6';
import Image from 'next/image';
import ReactPlayer from 'react-player';

interface Track {
  _id: string;
  title: string;
  url: string;
  author_name?: string;
  thumbnail_url?: string;
  trackInfo: {
    title: string;
    author_name: string;
    thumbnail_url: string;
    author_url: string;
    description: string;
    html: string;
  };
}

interface MusicNoteProps {
  onClick: () => void;
  onExpandChange?: (isExpanded: boolean) => void;
}

export default function MusicNote({ onClick, onExpandChange }: MusicNoteProps) {
  const [mounted, setMounted] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const [isArtistOverflowing, setIsArtistOverflowing] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const artistRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<ReactPlayer>(null);

  // Setze mounted auf true, wenn die Komponente auf dem Client gemountet ist
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // Nur ausführen, wenn die Komponente gemountet ist

    const hasSeenTooltip = localStorage.getItem('hasSeenMusicTooltip');
    if (!hasSeenTooltip) {
      setShowTooltip(true);
      localStorage.setItem('hasSeenMusicTooltip', 'true');
      setTimeout(() => {
        setShowTooltip(false);
      }, 3000);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return; // Nur ausführen, wenn die Komponente gemountet ist

    console.debug('[MusicNote] Starte Track-Ladung');
    fetch('/api/music')
      .then(res => {
        console.debug('[MusicNote] API Response Status:', res.status);
        return res.json();
      })
      .then(data => {
        console.debug('[MusicNote] API Data:', JSON.stringify({
          success: data.success,
          count: data.count,
          tracks: data.data?.length || 0,
          firstTrack: data.data?.[0] ? {
            id: data.data[0].id,
            title: data.data[0].trackInfo?.title,
            url: data.data[0].url,
            trackInfo: data.data[0].trackInfo
          } : null
        }, null, 2));

        if (data.success && data.data && data.data.length > 0) {
          console.debug('[MusicNote] Setze Tracks:', data.data.length);
          const tracks = data.data.map((track: any) => ({
            _id: track.id,
            title: track.trackInfo?.title,
            url: track.url,
            trackInfo: track.trackInfo
          }));
          setTracks(tracks);

          const firstTrack = tracks[0];
          console.debug('[MusicNote] Setze ersten Track:', {
            id: firstTrack._id,
            title: firstTrack.trackInfo?.title,
            url: firstTrack.url
          });
          setTrack(firstTrack);
        } else {
          console.warn('[MusicNote] Keine Tracks gefunden in der Antwort');
        }
      })
      .catch(e => {
        console.error('[MusicNote] API Fehler:', e);
        console.error('[MusicNote] Fehler-Stack:', e.stack);
      });
  }, [mounted]);

  useEffect(() => {
    if (track && 'mediaSession' in navigator) {
      // Konvertiere die SoundCloud-URL in eine direkte Bild-URL
      const thumbnailUrl = track.trackInfo?.thumbnail_url?.replace('large', 't500x500') || '';
      const proxyUrl = thumbnailUrl ? `/api/music/artwork?url=${encodeURIComponent(thumbnailUrl)}` : '';

      // Verwende das Original-Cover-Art für die MediaSession
      const mediaSessionArtwork = proxyUrl ? [
        { src: proxyUrl, sizes: '512x512', type: 'image/jpeg' }
      ] : [];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.trackInfo?.title || 'Unbekannter Titel',
        artist: track.trackInfo?.author_name || 'Unbekannter Künstler',
        album: 'Huegelfest',
        artwork: mediaSessionArtwork
      });

      // Media Session Action Handler
      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playRandomTrack();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playRandomTrack();
      });
    }
  }, [track]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      const newExpandedState = !isExpanded;
      setIsExpanded(newExpandedState);
      onExpandChange?.(newExpandedState);
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
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
      const newExpandedState = !isExpanded;
      setIsExpanded(newExpandedState);
      onExpandChange?.(newExpandedState);
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 50]);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const playRandomTrack = () => {
    console.debug('[MusicNote] Playing random track');
    if (tracks.length === 1) {
      setCurrentTrackIndex(0);
      setTrack(tracks[0]);
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
      return;
    }

    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * tracks.length);
    } while (randomIndex === currentTrackIndex && tracks.length > 1);

    console.debug('[MusicNote] Neuer Track-Index:', randomIndex);
    setCurrentTrackIndex(randomIndex);
    setTrack(tracks[randomIndex]);
    setIsPlaying(true);

    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const togglePlay = () => {
    if (!track?._id) {
      console.warn('[MusicNote] Kann nicht abspielen: Kein Track gefunden');
      return;
    }

    console.debug('[MusicNote] Toggle Play:', {
      currentState: isPlaying ? 'playing' : 'paused',
      trackTitle: track.trackInfo?.title,
      trackId: track._id
    });

    setIsPlaying(prevState => !prevState);
    onClick();
  };

  // Wenn die Komponente noch nicht gemountet ist, zeige einen leeren Container
  if (!mounted) {
    return <div className={styles.musicNote} />;
  }

  return (
    <div
      className={`${styles.musicNote} ${isExpanded ? styles.expanded : ''} ${showTooltip ? styles.showTooltip : ''}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={styles.iconContainer}
        onClick={togglePlay}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePlay();
          }
        }}
      >
        <FaCompactDisc 
          size={48}
          className={isPlaying ? styles.spinning : styles.paused} 
        />
        {track?.trackInfo?.thumbnail_url && (
          <div className={styles.coverArtContainer}>
            <Image
              src={track.trackInfo.thumbnail_url}
              alt={track.trackInfo.title}
              width={32}
              height={32}
              className={`${styles.coverArt} ${isPlaying ? styles.spinning : styles.paused}`}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                target.parentElement?.classList.add('bg-gradient-to-br', 'from-purple-500', 'to-pink-500');
              }}
            />
          </div>
        )}
      </div>
      {isExpanded && (
        <>
          <div className={styles.trackInfo}>
            <div
              ref={titleRef}
              className={`${styles.trackTitle} ${isTitleOverflowing ? styles.marquee : ''}`}
            >
              {track?.trackInfo?.title}
            </div>
            <div
              ref={artistRef}
              className={styles.trackArtist}
            >
              {track?.trackInfo?.author_name}
            </div>
          </div>
          <div className={styles.playerControls}>
            <div 
              className={styles.controlButton}
              onClick={(e) => {
                e.stopPropagation();
                console.debug('[MusicNote] Dice button clicked');
                playRandomTrack();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  playRandomTrack();
                }
              }}
            >
              <FaDice size={24} />
            </div>
          </div>
        </>
      )}
      {/* ReactPlayer */}
      {track?._id && (
        <div className={styles.playerContainer}>
          <ReactPlayer
            ref={audioRef}
            url={`/api/music/stream?id=${track._id}`}
            playing={isPlaying}
            controls={false}
            width="0"
            height="0"
            onEnded={() => playRandomTrack()}
            onError={(e) => {
              console.error('[MusicNote] ReactPlayer error:', e);
              console.error('[MusicNote] Track ID:', track?._id);
              console.error('[MusicNote] Track URL:', track?.url);
              console.error('[MusicNote] Is Playing:', isPlaying);
              // Versuche den Track neu zu laden
              if (track?._id) {
                playRandomTrack();
              }
            }}
            onReady={() => {
              console.debug('[MusicNote] ReactPlayer ready');
            }}
            onBuffer={() => {
              console.debug('[MusicNote] ReactPlayer buffering');
            }}
            onBufferEnd={() => {
              console.debug('[MusicNote] ReactPlayer buffer ended');
            }}
          />
        </div>
      )}
    </div>
  );
}
