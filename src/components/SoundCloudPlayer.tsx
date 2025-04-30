'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaPlay, FaPause } from 'react-icons/fa6';

interface SoundCloudTrack {
  id: number;
  title: string;
  artwork_url: string;
  permalink_url: string;
  duration: number;
  user: {
    username: string;
  };
}

interface SoundCloudWidgetOptions {
  auto_play?: boolean;
  show_artwork?: boolean;
  visual?: boolean;
  hide_related?: boolean;
  show_comments?: boolean;
  show_user?: boolean;
  show_reposts?: boolean;
  show_teaser?: boolean;
  single_active?: boolean;
  buying?: boolean;
  sharing?: boolean;
  download?: boolean;
  start_track?: number;
  callback?: () => void;
}

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
  getCurrentSound: (callback: (sound: SoundCloudTrack) => void) => void;
  load: (url: string, options: SoundCloudWidgetOptions) => void;
}

interface SoundCloudEvents {
  READY: string;
  PLAY: string;
  PAUSE: string;
  FINISH: string;
}

interface SoundCloudAPI {
  Widget: {
    Events: SoundCloudEvents;
    (element: HTMLIFrameElement): SoundCloudWidget;
  };
}

declare global {
  interface Window {
    SC: SoundCloudAPI;
  }
}

interface SoundCloudPlayerProps {
  onClose?: () => void;
}

export default function SoundCloudPlayer({ onClose }: SoundCloudPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [musicUrls, setMusicUrls] = useState<string[]>([]);
  const [trackInfo, setTrackInfo] = useState<{ title: string; artist: string } | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const widgetRef = useRef<SoundCloudWidget | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const currentTrackRef = useRef<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        setIsScrolled(footerRect.top < windowHeight);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
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

    let iframe: HTMLIFrameElement | null = null;

    script.onload = () => {
      const trackUrl = currentTrackRef.current || musicUrls[Math.floor(Math.random() * musicUrls.length)];
      currentTrackRef.current = trackUrl;

      let playerUrl = trackUrl;
      if (trackUrl.includes('on.soundcloud.com')) {
        playerUrl = `https://soundcloud.com${trackUrl.split('on.soundcloud.com')[1]}`;
      }

      iframe = document.createElement('iframe');
      iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(playerUrl)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=true`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframeRef.current = iframe;

      const widget = window.SC.Widget(iframe);
      widgetRef.current = widget;

      widget.bind(window.SC.Widget.Events.READY, () => {
        updateCoverArt(widget);
        widget.play();
      });

      widget.bind(window.SC.Widget.Events.PLAY, () => {
        setIsPlaying(true);
      });

      widget.bind(window.SC.Widget.Events.PAUSE, () => {
        setIsPlaying(false);
      });

      widget.bind(window.SC.Widget.Events.FINISH, () => {
        const newRandomIndex = Math.floor(Math.random() * musicUrls.length);
        const newRandomUrl = musicUrls[newRandomIndex];
        let nextPlayerUrl = newRandomUrl;
        if (newRandomUrl.includes('on.soundcloud.com')) {
          nextPlayerUrl = `https://soundcloud.com${newRandomUrl.split('on.soundcloud.com')[1]}`;
        }
        widget.load(nextPlayerUrl, {
          auto_play: true,
          hide_related: true,
          show_comments: false,
          show_user: false,
          show_reposts: false,
          visual: true
        });
      });
    };

    return () => {
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [musicUrls]);

  const updateCoverArt = async (widget: SoundCloudWidget) => {
    try {
      console.log('Starte Abruf der Track-Informationen...');
      
      // Hole die aktuelle URL aus dem currentTrackRef
      const currentUrl = currentTrackRef.current;
      if (!currentUrl) {
        console.error('Keine aktuelle URL gefunden');
        return;
      }

      // Hole die Track-Informationen von unserer API
      const response = await fetch('/api/soundcloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: currentUrl }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Track-Informationen');
      }

      const trackInfo = await response.json();
      console.log('Track-Informationen von API:', trackInfo);

      // Aktualisiere Cover und Track-Informationen
      setCoverUrl(trackInfo.coverUrl);
      setTrackInfo({
        title: trackInfo.title,
        artist: trackInfo.artist
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Cover-Art:', error);
    }
  };

  const togglePlay = () => {
    if (widgetRef.current) {
      widgetRef.current.toggle();
    }
  };

  if (musicUrls.length === 0) {
    return null;
  }

  return (
    <div className={`fixed right-0 z-50 transition-all duration-300 ${isScrolled ? 'md:bottom-0 -bottom-16' : 'bottom-0'} w-full md:w-72 md:right-0`}>
      <div className="bg-[#460b6c] text-[#ff9900] p-2 rounded-t-lg shadow-lg w-full">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 items-center">
          <div className="w-6 h-6 relative rounded overflow-hidden bg-gray-800">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt="Cover"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FaPlay className="text-[#ff9900] text-xs" />
              </div>
            )}
          </div>
          <div className="overflow-hidden max-w-[calc(100%-60px)]">
            <div className="whitespace-nowrap animate-marquee">
              <span className="font-bold text-[10px] sm:text-xs inline-block mr-4">{trackInfo?.title || 'Kein Track'}</span>
              <span className="font-bold text-[10px] sm:text-xs inline-block mr-4">{trackInfo?.title || 'Kein Track'}</span>
            </div>
          </div>
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-[#ff9900] hover:bg-[#ff9900]/80 transition-colors"
          >
            {isPlaying ? (
              <FaPause className="text-[#460b6c] text-sm" />
            ) : (
              <FaPlay className="text-[#460b6c] text-sm" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#ff9900] hover:bg-[#ff9900]/80 transition-colors"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className="w-4 h-4 text-[#460b6c]"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>
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