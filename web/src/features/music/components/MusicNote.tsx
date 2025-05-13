"use client";

import React, { useRef, useState, useEffect } from 'react';
import { FaCompactDisc, FaDice } from 'react-icons/fa6';
import ReactPlayer from 'react-player';
import Image from 'next/image';

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
  const [tracks, setTracks] = useState<TrackWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<ReactPlayer>(null);
  const [coverError, setCoverError] = useState(false);

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/music/tracks");
        if (!res.ok) throw new Error("Fehler beim Laden der Musikdaten");
        const data = await res.json();
        setTracks(data.tracks);
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

  console.log('Render: loading', loading, 'error', error, 'tracks', tracks, 'currentTrackIndex', currentTrackIndex);

  return (
    <div
      className="fixed top-4 right-4 z-50 bg-[#460b6c] text-white rounded-full shadow-lg flex items-center p-2 cursor-pointer select-none"
      style={{ minWidth: 64 }}
    >
      <div
        onClick={togglePlay}
        className="relative flex items-center justify-center"
        style={{ width: 48, height: 48 }}
      >
        <FaCompactDisc
          className={isPlaying ? 'animate-spin' : ''}
          size={48}
          style={{ color: 'white' }}
        />
        {hasTrack && currentTrack?.trackInfo.thumbnail_url && !coverError && (
          <div
            style={{
              position: 'absolute',
              width: 28,
              height: 28,
              borderRadius: '50%',
              overflow: 'hidden',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              border: '2px solid #fff',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Image
              src={currentTrack.trackInfo.thumbnail_url}
              alt={currentTrack.trackInfo.title}
              width={28}
              height={28}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
              onError={() => setCoverError(true)}
            />
          </div>
        )}
      </div>
      {isExpanded && hasTrack && (
        <div className="ml-3">
          <div className="font-bold text-sm">{currentTrack?.trackInfo.title}</div>
          <div className="text-xs text-gray-200">{currentTrack?.trackInfo.author_name}</div>
        </div>
      )}
      <button
        className="ml-2 bg-[#ff9900] text-white rounded-full p-1 hover:bg-orange-600"
        onClick={playRandomTrack}
        title="Zufälligen Track abspielen"
        disabled={!hasTrack}
      >
        <FaDice />
      </button>
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