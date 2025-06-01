'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
  progress?: number;
  error?: string | null;
}

interface Star {
  id: number;
  left: string;
  top: string;
  animationDelay: string;
  opacity: number;
  transform: string;
}

export default function SplashScreen({ isVisible, onComplete, progress = 0, error }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [stars, setStars] = useState<Star[]>([]);
  const [mounted, setMounted] = useState(false);
  const [cssLoaded, setCssLoaded] = useState(true);

  // Check if CSS is loaded (Tailwind classes available)
  useEffect(() => {
    const testElement = document.createElement('div');
    testElement.className = 'bg-red-500'; // Test Tailwind class
    document.body.appendChild(testElement);
    
    const styles = window.getComputedStyle(testElement);
    const hasStylesLoaded = styles.backgroundColor === 'rgb(239, 68, 68)' || // red-500
                           (styles.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                            styles.backgroundColor !== 'transparent' &&
                            styles.backgroundColor !== '');
    
    document.body.removeChild(testElement);
    
    if (!hasStylesLoaded) {
      console.warn('[SplashScreen] CSS möglicherweise nicht geladen - verwende Fallback-Styles');
      setCssLoaded(false);
    }
  }, []);

  // Initialize stars only on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const newStars: Star[] = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 6}s`,
      opacity: Math.random() * 0.8 + 0.2,
      transform: `scale(${Math.random() * 0.8 + 0.5})`,
    }));
    setStars(newStars);
  }, []);

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

  // Fallback Inline Styles für den Fall dass CSS nicht geladen ist
  const fallbackStyles = !cssLoaded ? {
    container: {
      position: 'fixed' as const,
      inset: '0',
      zIndex: 10000,
      background: 'linear-gradient(135deg, #460b6c, #2a0845)',
      color: '#ff9900',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      transition: 'opacity 0.5s',
      opacity: fadeOut ? 0 : 1
    },
    content: {
      position: 'relative' as const,
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem',
      textAlign: 'center' as const
    },
    logo: {
      position: 'relative' as const,
      background: 'white',
      borderRadius: '50%',
      padding: '2rem',
      boxShadow: '0 0 40px rgba(255, 153, 0, 0.4)',
      border: '4px solid rgba(255, 153, 0, 0.2)'
    },
    title: {
      fontSize: '3rem',
      fontWeight: 'bold',
      color: '#ff9900',
      margin: '0 0 0.5rem 0',
      textShadow: '0 0 20px rgba(255, 153, 0, 0.5)'
    },
    subtitle: {
      color: 'rgba(255, 153, 0, 0.9)',
      fontSize: '1.25rem',
      margin: '0'
    },
    dots: {
      display: 'flex',
      gap: '0.75rem'
    },
    dot: {
      width: '1rem',
      height: '1rem',
      background: '#ff9900',
      borderRadius: '50%',
      animation: 'bounce 1.2s infinite'
    }
  } : {};

  return (
    <div 
      className={cssLoaded ? `fixed inset-0 z-[10000] bg-[#460b6c] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }` : ''}
      style={!cssLoaded ? fallbackStyles.container : {}}
    >
      {/* Starfield-ähnlicher Hintergrund */}
      {cssLoaded && (
        <div className="absolute inset-0 overflow-hidden">
          {mounted && stars.map((star) => (
            <div
              key={star.id}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                left: star.left,
                top: star.top,
                animationDelay: star.animationDelay,
                opacity: star.opacity,
                transform: star.transform,
              }}
            />
          ))}
        </div>
      )}

      {/* Logo und Loading Content */}
      <div 
        className={cssLoaded ? "relative z-10 flex flex-col items-center justify-center space-y-8 animate-fade-in" : ""}
        style={!cssLoaded ? fallbackStyles.content : {}}
      >
        {/* Logo mit Glow-Effekt */}
        <div className={cssLoaded ? "relative" : ""}>
          {cssLoaded && (
            <>
              <div className="absolute inset-0 bg-[#ff9900] rounded-full blur-2xl opacity-40 animate-pulse scale-110"></div>
              <div className="absolute inset-0 border-2 border-transparent border-t-[#ff9900] rounded-full animate-spin opacity-60"></div>
            </>
          )}
          <div 
            className={cssLoaded ? "relative bg-white rounded-full p-8 shadow-2xl border-4 border-[#ff9900]/20" : ""}
            style={!cssLoaded ? fallbackStyles.logo : {}}
          >
            <Image 
              src="/logo.svg" 
              alt="Hügelfest Logo" 
              width={96} 
              height={96}
              className={cssLoaded ? "drop-shadow-lg" : ""}
              priority
            />
          </div>
        </div>

        {/* App Name */}
        <div className={cssLoaded ? "text-center space-y-3" : ""}>
          <h1 
            className={cssLoaded ? "text-5xl font-bold text-[#ff9900] font-display tracking-wider drop-shadow-lg" : ""}
            style={!cssLoaded ? fallbackStyles.title : {}}
          >
            Hügelfest
          </h1>
          <p 
            className={cssLoaded ? "text-[#ff9900]/90 text-xl font-mono tracking-wide" : ""}
            style={!cssLoaded ? fallbackStyles.subtitle : {}}
          >
            {error ? 'Verbindung wird hergestellt...' : 'Wird geladen...'}
          </p>
        </div>

        {/* Loading Animation Dots */}
        <div 
          className={cssLoaded ? "flex space-x-3" : ""}
          style={!cssLoaded ? fallbackStyles.dots : {}}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cssLoaded ? "w-4 h-4 bg-[#ff9900] rounded-full animate-bounce shadow-lg" : ""}
              style={!cssLoaded ? {
                ...fallbackStyles.dot,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.2s',
              } : {
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.2s',
              }}
            />
          ))}
        </div>

        {/* Status Text */}
        <div className={cssLoaded ? "text-center space-y-2" : ""}>
          {error ? (
            <div className={cssLoaded ? "text-orange-400 text-sm font-mono" : ""} style={!cssLoaded ? { color: 'rgba(255, 153, 0, 0.8)', fontSize: '0.9rem' } : {}}>
              <div className={cssLoaded ? "flex items-center justify-center space-x-2" : ""}>
                {cssLoaded && <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>}
                <span>{error}</span>
              </div>
            </div>
          ) : (
            <div className={cssLoaded ? "text-[#ff9900]/70 text-sm font-mono" : ""} style={!cssLoaded ? { color: 'rgba(255, 153, 0, 0.7)', fontSize: '0.9rem' } : {}}>
              {animatedProgress < 30 && "Bühne wird aufgebaut..."}
              {animatedProgress >= 30 && animatedProgress < 60 && "Sound wird gecheckt..."}
              {animatedProgress >= 60 && animatedProgress < 90 && "Getränke werden kaltgestellt..."}
              {animatedProgress >= 90 && "Bald geht's los..."}
            </div>
          )}
        </div>
      </div>

      {/* Subtle bottom text */}
      {cssLoaded && (
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
      )}

      {/* CSS Animation für Fallback */}
      {!cssLoaded && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes bounce {
              0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
              40% { transform: scale(1); opacity: 1; }
            }
          `
        }} />
      )}
    </div>
  );
} 