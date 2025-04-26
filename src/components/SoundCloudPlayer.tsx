'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaPlay, FaPause, FaVolumeHigh, FaVolumeXmark, FaMinus, FaPlus } from 'react-icons/fa6';

interface SoundCloudWidget {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (milliseconds: number) => void;
  setVolume: (volume: number) => void;
  bind: (event: string, callback: () => void) => void;
  unbind: (event: string) => void;
  getVolume: () => number;
  isPaused: () => boolean;
  getCurrentSound: (callback: (sound: any) => void) => void;
}

interface SoundCloudAPI {
  Widget: {
    Events: {
      READY: string;
      PLAY: string;
      PAUSE: string;
      FINISH: string;
    };
    (element: HTMLIFrameElement): SoundCloudWidget;
  };
}

declare global {
  interface Window {
    SC: SoundCloudAPI;
  }
}

export default function SoundCloudPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [musicUrls, setMusicUrls] = useState<string[]>([]);
  const [trackInfo, setTrackInfo] = useState<{ title: string; artist: string } | null>(null);
  const widgetRef = useRef<SoundCloudWidget | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    // Lade die Musik-URLs
    const loadMusicUrls = async () => {
      try {
        const response = await fetch('/api/music');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Musik-URLs');
        }
        const urls = await response.json();
        setMusicUrls(urls);
      } catch (error) {
        console.error('Fehler beim Laden der Musik-URLs:', error);
      }
    };

    loadMusicUrls();
  }, []);

  useEffect(() => {
    if (musicUrls.length === 0) return;

    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(musicUrls[0])}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=true`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const widget = (window as any).SC.Widget(iframe);
      widgetRef.current = widget;

      widget.bind((window as any).SC.Widget.Events.READY, () => {
        widget.getVolume((vol: number) => {
          setVolume(vol);
        });
        updateCoverArt(widget);
        widget.play();
      });

      widget.bind((window as any).SC.Widget.Events.PLAY, () => {
        setIsPlaying(true);
        updateCoverArt(widget);
      });

      widget.bind((window as any).SC.Widget.Events.PAUSE, () => {
        setIsPlaying(false);
      });

      widget.bind((window as any).SC.Widget.Events.FINISH, () => {
        setIsPlaying(false);
        updateCoverArt(widget);
      });

      iframeRef.current = iframe;
    };

    return () => {
      if (iframeRef.current) {
        document.body.removeChild(iframeRef.current);
      }
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, [musicUrls]);

  const updateCoverArt = async (widget: SoundCloudWidget) => {
    try {
      const sound = await new Promise<any>((resolve) => {
        widget.getCurrentSound(resolve);
      });
      
      if (sound) {
        if (sound.artwork_url) {
          setCoverUrl(sound.artwork_url);
        }
        setTrackInfo({
          title: sound.title || 'Unbekannter Titel',
          artist: sound.user?.username || 'Unbekannter Künstler'
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden des Cover-Art:', error);
    }
  };

  const togglePlay = () => {
    if (widgetRef.current) {
      widgetRef.current.toggle();
    }
  };

  const toggleMute = () => {
    if (widgetRef.current) {
      if (isMuted) {
        widgetRef.current.setVolume(volume);
      } else {
        widgetRef.current.setVolume(0);
      }
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (widgetRef.current) {
      widgetRef.current.setVolume(newVolume);
    }
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  };

  if (musicUrls.length === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 right-0 z-50 transition-all duration-300 ${isMinimized ? 'translate-y-[calc(100%-60px)]' : ''}`}>
      <div className="bg-[#460b6c] text-[#ff9900] p-3 rounded-t-lg shadow-lg w-72">
        {!isMinimized ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 relative rounded overflow-hidden bg-gray-800">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaPlay className="text-[#ff9900] text-lg" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 max-w-[140px] overflow-hidden">
                  <div className="flex items-center">
                    <div className="whitespace-nowrap animate-marquee">
                      <span className="font-bold text-xs inline-block mr-4">{trackInfo?.title || 'Kein Track'}</span>
                      <span className="font-bold text-xs inline-block mr-4">{trackInfo?.title || 'Kein Track'}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="whitespace-nowrap animate-marquee">
                      <span className="text-[10px] text-[#ff9900]/80 inline-block mr-4">{trackInfo?.artist || ''}</span>
                      <span className="text-[10px] text-[#ff9900]/80 inline-block mr-4">{trackInfo?.artist || ''}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-[#ff9900] hover:text-[#ff9900]/80"
              >
                <FaMinus />
              </button>
            </div>

            <div className="mt-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-[#ff9900] text-[#460b6c] flex items-center justify-center hover:bg-[#ff9900]/90"
                >
                  {isPlaying ? <FaPause className="text-xs" /> : <FaPlay className="text-xs" />}
                </button>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 bg-[#ff9900]/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={toggleMute}
                  className="text-[#ff9900] hover:text-[#ff9900]/80"
                >
                  {isMuted ? <FaVolumeXmark className="text-sm" /> : <FaVolumeHigh className="text-sm" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-end">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-11 h-11 relative rounded overflow-hidden bg-gray-800 hover:opacity-90 transition-opacity"
            >
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt="Cover"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FaPlay className="text-[#ff9900] text-lg" />
                </div>
              )}
            </button>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 10s linear infinite;
        }
      `}</style>
    </div>
  );
} 