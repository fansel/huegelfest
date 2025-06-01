"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Disc3, Dices } from 'lucide-react';
import Image from 'next/image';
import styles from './MusicNote.module.css';
import { getAllTracks, MusicEntry } from '@/features/music/actions/getAllTracks';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';

export interface TrackInfo {
  title: string;
  author_name: string;
  thumbnail_url: string;
  author_url: string;
  description: string;
  html: string;
}

export interface TrackWithUrl {
  url: string;
  trackInfo: TrackInfo;
}

export default function MusicNote() {
  const [tracks, setTracks] = useState<MusicEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [coverError, setCoverError] = useState(false);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const longPressTriggered = useRef(false);
  
  useEffect(() => {   
    const mount = mountRef.current;
    if (!mount) return;
    const fetchTracks = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllTracks();
        setTracks(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, []);

  // WebSocket: Füge neuen Track hinzu, wenn Topic 'music-new-track'
  useGlobalWebSocket({
    topicFilter: ['music-new-track'],
    onMessage: (msg) => {
      if (msg.topic === 'music-new-track') {
        const newTrack = msg.payload as MusicEntry;
        setTracks((prev) => {
          if (prev.some(t => t._id === newTrack._id)) return prev;
          return [...prev, newTrack];
        });
      }
    }
  });

  useEffect(() => {
    if (!loading) {
      console.log('Tracks geladen:', tracks);
      if (error) {
        console.error('Fehler beim Laden:', error);
      }
    }
  }, [loading, tracks, error]);

  // Set random track on first load
  useEffect(() => {
    if (!loading && tracks.length > 0 && currentTrackIndex === 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      setCurrentTrackIndex(randomIndex);
    }
  }, [loading, tracks, currentTrackIndex]);

  useEffect(() => {
    setCoverError(false);
  }, [currentTrackIndex]);

  // Play/Pause steuern
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const playRandomTrack = () => {
    if (tracks.length > 1) {
      let nextIndex = Math.floor(Math.random() * tracks.length);
      if (nextIndex === currentTrackIndex) {
        nextIndex = (nextIndex + 1) % tracks.length;
      }
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(true);
    }
  };

  const handlePressStart = () => {
    longPressTriggered.current = false;
    longPressTimeout.current = setTimeout(() => {
      longPressTriggered.current = true;
      setIsExpanded(v => !v);
    }, 600);
  };
  
  const handlePressEnd = () => {
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
  };

  // Prevent expand/collapse interaction from affecting play state
  const handleTogglePlay = (e: React.MouseEvent) => {
    // Wenn gerade ein Long-Press erfolgreich war, ignoriere den Click
    if (longPressTriggered.current) {
      longPressTriggered.current = false; // Reset für nächstes Mal
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation(); // Prevent event bubbling to long press handlers
    setIsPlaying((prev) => !prev);
  };

  const hasTrack = tracks.length > 0;
  const currentTrack = hasTrack ? tracks[currentTrackIndex] : undefined;

  console.log('Render: loading', loading, 'error', error, 'tracks', tracks, 'currentTrackIndex', currentTrackIndex);

  return (
    <div
      ref={mountRef}
      className={`${styles.musicNote} ${isExpanded ? styles.expanded : ''} text-white rounded-full shadow-lg flex items-center p-2 cursor-pointer select-none`}
      style={{ minWidth: 64 }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <div
        onClick={handleTogglePlay}
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: 48, height: 48, minWidth: 48 }}
      >
        <div className={styles.vinylBg} />
        <Disc3
          className={`${styles.spinning} ${!isPlaying ? styles.paused : ''}`}
          size={48}
          strokeWidth={1.5}
          style={{ color: 'white', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        />
        {hasTrack && currentTrack?.coverArtData && currentTrack?.coverArtMimeType && !coverError && (
          <div
            className="absolute"
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              overflow: 'hidden',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Image
              src={`data:${currentTrack?.coverArtMimeType ?? ''};base64,${currentTrack?.coverArtData ?? ''}`}
              alt={currentTrack?.trackInfo.title ?? 'Cover'}
              width={20}
              height={20}
              className={isPlaying ? styles.spinning : styles.paused}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
              onError={() => setCoverError(true)}
            />
          </div>
        )}
        <div
          className="absolute"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'transparent',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      </div>
      
      {isExpanded && hasTrack && (
        <div className="ml-3 overflow-hidden flex-1" style={{ minWidth: 0, maxWidth: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: 'white' }}>
          <div className={styles.trackTitleMarquee} style={{ fontSize: '0.8rem', fontWeight: '500', marginBottom: '2px' }}>
            <span className={styles.marqueeInner}>{currentTrack?.trackInfo.title}</span>
          </div>
          <div className={styles.trackArtist} style={{ fontSize: '0.7rem', opacity: 0.8, whiteSpace: 'nowrap' }}>{currentTrack?.trackInfo.author_name}</div>
        </div>
      )}
      {isExpanded && (
        <button
          className="ml-2 rounded-full p-1 transition"
          style={{ background: '#ff9900', color: 'white' }}
          onClick={playRandomTrack}
          title="Zufälligen Track abspielen"
          disabled={!hasTrack}
          onMouseOver={e => (e.currentTarget.style.background = '#cc7a00')}
          onMouseOut={e => (e.currentTarget.style.background = '#ff9900')}
        >
          <Dices strokeWidth={1.5} />
        </button>
      )}
      
      {hasTrack && (
        <audio
          ref={audioRef}
          src={currentTrack!.url}
          preload="none"
          onEnded={playRandomTrack}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
} 