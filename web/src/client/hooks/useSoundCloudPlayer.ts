import { useState, useCallback, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player/soundcloud';

export interface Track {
  title: string;
  url: string;
  author_name: string;
  thumbnail_url: string;
}

interface UseSoundCloudPlayerProps {
  tracks: Track[];
}

interface UseSoundCloudPlayerReturn {
  isPlaying: boolean;
  currentTrack: Track | null;
  isSpinning: boolean;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  error: Error | null;
  playerRef: React.RefObject<ReactPlayer>;
}

export const useSoundCloudPlayer = ({
  tracks = [],
}: UseSoundCloudPlayerProps): UseSoundCloudPlayerReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const playerRef = useRef<ReactPlayer>(null);

  // Sicherstellen, dass currentTrackIndex innerhalb der Grenzen bleibt
  useEffect(() => {
    if (tracks.length > 0 && currentTrackIndex >= tracks.length) {
      setCurrentTrackIndex(0);
    }
  }, [tracks.length, currentTrackIndex]);

  const currentTrack = tracks.length > 0 ? tracks[currentTrackIndex] : null;

  useEffect(() => {
    setIsSpinning(isPlaying);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (tracks.length === 0) return;
    setIsPlaying(!isPlaying);
  }, [isPlaying, tracks.length]);

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const previousTrack = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  return {
    isPlaying,
    currentTrack,
    isSpinning,
    togglePlay,
    nextTrack,
    previousTrack,
    error,
    playerRef,
  };
};
