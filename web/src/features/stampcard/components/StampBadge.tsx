"use client";
import React from "react";

export interface StampBadgeProps {
  collected: boolean;
  className?: string;
}

/**
 * Zeigt das Nachteule-Stempel-Badge als SVG an.
 * Wenn 'collected' true ist, wird das Badge farbig und animiert angezeigt.
 */
export const StampBadge: React.FC<StampBadgeProps> = ({ collected, className }) => {
  return (
    <div className={className} title="Nachteule-Stempel">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: collected ? "drop-shadow(0 0 8px #FFD700)" : undefined, opacity: collected ? 1 : 0.3, transition: 'opacity 0.3s' }}
      >
        {/* Eule-Körper */}
        <ellipse cx="32" cy="40" rx="18" ry="20" fill={collected ? "#6B4F1D" : "#BDBDBD"} />
        {/* Kopf */}
        <ellipse cx="32" cy="24" rx="14" ry="12" fill={collected ? "#8D6E3F" : "#E0E0E0"} />
        {/* Augen */}
        <ellipse cx="26" cy="24" rx="3" ry="3.5" fill="#fff" />
        <ellipse cx="38" cy="24" rx="3" ry="3.5" fill="#fff" />
        <ellipse cx="26" cy="24" rx="1.2" ry="1.5" fill="#222" />
        <ellipse cx="38" cy="24" rx="1.2" ry="1.5" fill="#222" />
        {/* Schnabel */}
        <polygon points="32,28 30,26 34,26" fill="#FFD700" />
        {/* Flügel */}
        <ellipse cx="16" cy="42" rx="5" ry="10" fill={collected ? "#8D6E3F" : "#E0E0E0"} />
        <ellipse cx="48" cy="42" rx="5" ry="10" fill={collected ? "#8D6E3F" : "#E0E0E0"} />
        {/* Sterne */}
        {collected && (
          <g>
            <circle cx="12" cy="10" r="2" fill="#FFD700" />
            <circle cx="54" cy="8" r="1.5" fill="#FFD700" />
            <circle cx="44" cy="4" r="1" fill="#FFD700" />
          </g>
        )}
      </svg>
    </div>
  );
}; 