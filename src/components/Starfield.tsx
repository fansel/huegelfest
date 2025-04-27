'use client'; // (nur wenn du Next.js 13/14 mit App Router benutzt)

import React, { useEffect, useState } from 'react';
import styles from './Starfield.module.css';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDelay: number;
}

const Starfield: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const [activeShootingStar, setActiveShootingStar] = useState<number | null>(null);

  useEffect(() => {
    const generateStars = () => {
      const newStars: Star[] = [];
      const starCount = 300; // Mehr Sterne für bessere Abdeckung

      // Erste Hälfte der Sterne für den oberen Bereich
      for (let i = 0; i < starCount / 2; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 50, // Nur obere Hälfte
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.7 + 0.3,
          animationDelay: Math.random() * 5,
        });
      }

      // Zweite Hälfte der Sterne für den unteren Bereich
      for (let i = starCount / 2; i < starCount; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 50 + 50, // Nur untere Hälfte
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.7 + 0.3,
          animationDelay: Math.random() * 5,
        });
      }

      setStars(newStars);
    };

    generateStars();

    // Sterne alle 15 Sekunden neu generieren für mehr Dynamik
    const interval = setInterval(generateStars, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const showRandomStar = () => {
      const randomIndex = Math.floor(Math.random() * 9); // 0-8
      setActiveShootingStar(randomIndex);

      // Nach 2.75 Sekunden (der Animationsdauer) wieder ausblenden
      timeoutId = setTimeout(() => {
        setActiveShootingStar(null);
        // Nach einer zufälligen Pause (10-60 Sekunden) nächste Sternschnuppe
        setTimeout(showRandomStar, Math.random() * 50000 + 10000);
      }, 2750);
    };

    showRandomStar();

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className={styles.starfield}>
      <div className={styles.stars}>
        {stars.map((star) => (
          <div
            key={star.id}
            className={styles.star}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.animationDelay}s`,
            }}
          />
        ))}
      </div>
      {[...Array(9)].map((_, i) => (
        <div
          key={i}
          className={styles.shootingStar}
          style={{
            display: activeShootingStar === i ? 'block' : 'none',
            opacity: activeShootingStar === i ? 1 : 0,
          }}
        />
      ))}
    </div>
  );
};

export default Starfield;
