import React, { useState } from "react";
import { StampBadge } from "./StampBadge";

export interface PatternGeneratorProps {
  pointsCount?: number; // Anzahl der Punkte um das Badge herum
  onPatternChange?: (pattern: boolean[]) => void;
}

/**
 * PatternGenerator: Erzeugt ein SVG mit Badge in der Mitte und Punkten im Kreis drumherum.
 * Die aktiven Punkte ergeben den Pattern-Code.
 */
export const PatternGenerator: React.FC<PatternGeneratorProps> = ({ pointsCount = 8, onPatternChange }) => {
  const [pattern, setPattern] = useState<boolean[]>(Array(pointsCount).fill(false));

  const togglePoint = (idx: number) => {
    const newPattern = pattern.map((v, i) => (i === idx ? !v : v));
    setPattern(newPattern);
    onPatternChange?.(newPattern);
  };

  // SVG-Parameter
  const radius = 80; // Abstand der Punkte vom Mittelpunkt
  const center = 100;
  const pointRadius = 10;

  return (
    <svg width={200} height={200} viewBox="0 0 200 200">
      {/* Punkte im Kreis */}
      {pattern.map((active, i) => {
        const angle = (2 * Math.PI * i) / pointsCount - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={pointRadius}
            fill={active ? "#222" : "#fff"}
            stroke="#222"
            strokeWidth={2}
            style={{ cursor: "pointer" }}
            onClick={() => togglePoint(i)}
          />
        );
      })}
      {/* Badge in der Mitte, ohne Hintergrund */}
      <g transform="translate(50, 60) scale(1.1)">
        <StampBadge collected={true} />
      </g>
    </svg>
  );
}; 