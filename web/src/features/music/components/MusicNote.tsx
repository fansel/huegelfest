"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Disc3, Dices } from 'lucide-react';
import ReactPlayer from 'react-player';
import Image from 'next/image';
import styles from './MusicNote.module.css';
import { getAllTracks, MusicEntry } from '@/features/music/actions/getAllTracks';

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
  const audioRef = useRef<ReactPlayer>(null);
  const [coverError, setCoverError] = useState(false);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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

  useEffect(() => {
    if (!loading) {
      console.log('Tracks geladen:', tracks);
      if (error) {
        console.error('Fehler beim Laden:', error);
      }
    }
  }, [loading, tracks, error]);

  useEffect(() => {
    setCoverError(false);
  }, [currentTrackIndex]);

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

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const hasTrack = tracks.length > 0;
  const currentTrack = hasTrack ? tracks[currentTrackIndex] : undefined;

  const handlePressStart = () => {
    longPressTimeout.current = setTimeout(() => setIsExpanded(v => !v), 600);
  };
  const handlePressEnd = () => {
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
  };

  console.log('Render: loading', loading, 'error', error, 'tracks', tracks, 'currentTrackIndex', currentTrackIndex);

  return (
    <div
      className={`${styles.musicNote} ${isExpanded ? styles.expanded : ''} text-white rounded-full shadow-lg flex items-center p-2 cursor-pointer select-none`}
      style={{ minWidth: 64 }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <div
        onClick={togglePlay}
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
        <div className="ml-3 overflow-hidden" style={{ minWidth: 0, flex: 1, maxWidth: 180 }}>
          <div className={styles.trackTitleMarquee}>
            <span className={styles.marqueeInner}>{currentTrack?.trackInfo.title}</span>
          </div>
          <div className={styles.trackArtist} style={{ whiteSpace: 'nowrap' }}>{currentTrack?.trackInfo.author_name}</div>
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
        <ReactPlayer
          ref={audioRef}
          url={currentTrack!.url}
          playing={isPlaying}
          controls={false}
          width="0"
          height="0"
          onEnded={playRandomTrack}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
} 