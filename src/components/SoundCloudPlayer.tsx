'use client';

import { useState, useEffect } from 'react';

export default function SoundCloudPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    document.body.appendChild(script);

    // Warte bis die SoundCloud API geladen ist
    const checkSC = setInterval(() => {
      if ((window as any).SC) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          const widget = (window as any).SC.Widget(iframe);
          widget.bind((window as any).SC.Widget.Events.READY, () => {
            widget.bind((window as any).SC.Widget.Events.PLAY, () => {
              setIsPlaying(true);
            });
            widget.bind((window as any).SC.Widget.Events.PAUSE, () => {
              setIsPlaying(false);
            });
          });
        }
        clearInterval(checkSC);
      }
    }, 100);

    return () => {
      document.body.removeChild(script);
      clearInterval(checkSC);
    };
  }, []);

  const togglePlay = () => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      const widget = (window as any).SC.Widget(iframe);
      if (isPlaying) {
        widget.pause();
      } else {
        widget.play();
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const iframe = document.querySelector('iframe');
    if (iframe) {
      const widget = (window as any).SC.Widget(iframe);
      widget.setVolume(newVolume * 100);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center space-x-4 bg-[#460b6c] bg-opacity-80 backdrop-blur-sm p-3 rounded-lg shadow-lg">
        <div className="w-12 h-12 rounded-lg overflow-hidden">
          <img 
            src="https://i1.sndcdn.com/artworks-f4ffJzJz9KxUMMDT-nfG9yQ-t1080x1080.jpg" 
            alt="Track Cover" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePlay}
            className="text-[#ff9900] hover:text-orange-300 transition-colors"
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 accent-[#ff9900]"
          />
        </div>
      </div>
      <iframe
        width="0"
        height="0"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1624202532&color=%23ff9900&auto_play=true&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false"
        className="hidden"
      />
    </div>
  );
} 