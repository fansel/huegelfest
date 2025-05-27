'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
  progress?: number;
  error?: string | null;
}

export default function SplashScreen({ isVisible, onComplete, progress = 0, error }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    if (!isVisible && onComplete) {
      // Fade-out Animation starten
      setFadeOut(true);
      const timer = setTimeout(() => {
        onComplete();
      }, 500); // 500ms für Fade-out
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible && !fadeOut) return null;

  return (
    <div 
      className={`fixed inset-0 z-[10000] bg-[#460b6c] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Starfield-ähnlicher Hintergrund */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              opacity: Math.random() * 0.8 + 0.2,
              transform: `scale(${Math.random() * 0.8 + 0.5})`,
            }}
          />
        ))}
      </div>

      {/* Logo und Loading Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 animate-fade-in">
        {/* Logo mit Glow-Effekt */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#ff9900] rounded-full blur-2xl opacity-40 animate-pulse scale-110"></div>
          <div className="relative bg-white rounded-full p-8 shadow-2xl border-4 border-[#ff9900]/20">
            <Image 
              src="/logo.svg" 
              alt="Hügelfest Logo" 
              width={96} 
              height={96}
              className="drop-shadow-lg"
              priority
            />
          </div>
          {/* Rotating ring */}
          <div className="absolute inset-0 border-2 border-transparent border-t-[#ff9900] rounded-full animate-spin opacity-60"></div>
        </div>

        {/* App Name mit Typewriter-Effekt */}
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold text-[#ff9900] font-display tracking-wider drop-shadow-lg">
            Hügelfest
          </h1>
          <p className="text-[#ff9900]/90 text-xl font-mono tracking-wide">
            {error ? 'Verbindung wird hergestellt...' : 'Wird geladen...'}
          </p>
        </div>

        {/* Loading Animation Dots */}
        <div className="flex space-x-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 bg-[#ff9900] rounded-full animate-bounce shadow-lg"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.2s',
              }}
            />
          ))}
        </div>

        {/* Status Text */}
        <div className="text-center space-y-2">
          {error ? (
            <div className="text-orange-400 text-sm font-mono">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span>{error}</span>
              </div>
            </div>
          ) : (
            <div className="text-[#ff9900]/70 text-sm font-mono">
              {animatedProgress < 30 && "Bühne wird aufgebaut..."}
              {animatedProgress >= 30 && animatedProgress < 60 && "Sound wird gecheckt..."}
              {animatedProgress >= 60 && animatedProgress < 90 && "Getränke werden kaltgestellt..."}
              {animatedProgress >= 90 && "Bald geht's los..."}
            </div>
          )}
        </div>
      </div>

      {/* Subtle bottom text */}
      <div className="absolute bottom-8 text-center space-y-2">
        <p className="text-[#ff9900]/60 text-sm font-mono">
          Die offizielle Hügelfest App
        </p>
        <div className="flex items-center justify-center space-x-2 text-[#ff9900]/40 text-xs">
          <div className="w-1 h-1 bg-[#ff9900]/40 rounded-full animate-pulse"></div>
          <span>von Fansel</span>
          <div className="w-1 h-1 bg-[#ff9900]/40 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
} 