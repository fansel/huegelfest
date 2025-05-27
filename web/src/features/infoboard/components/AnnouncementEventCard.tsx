import React from 'react';
import { ReactionType, REACTION_EMOJIS } from '@/shared/types/types';
import { formatDateBerlin } from '@/shared/utils/formatDateBerlin';

interface AnnouncementEventCardReactions {
  counts: Record<ReactionType, number>;
  userReaction?: ReactionType;
}

interface AnnouncementEventCardProps {
  content: string;
  groupName: string;
  groupColor?: string;
  important?: boolean;
  createdAt?: string;
  reactions?: AnnouncementEventCardReactions;
  onReact?: (type: ReactionType) => void;
  className?: string;
  isOffline?: boolean;
}

// Hilfsfunktion für kontrastreiche Textfarbe
function getContrastTextColor(bgColor: string): string {
  // Annahme: bgColor ist hex wie #RRGGBB
  if (!bgColor.startsWith('#') || bgColor.length !== 7) return '#fff';
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  // YIQ-Formel für Kontrast
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 180 ? '#222' : '#fff';
}

export const AnnouncementEventCard: React.FC<AnnouncementEventCardProps> = ({
  content,
  groupName,
  groupColor = '#ff9900',
  important,
  createdAt,
  reactions,
  onReact,
  className,
  isOffline = false,
}) => {
  const groupTextColor = getContrastTextColor(groupColor);
  
  return (
    <div
      className={`bg-[#460b6c]/50 backdrop-blur-sm border border-[#ff9900]/20 rounded-lg p-4 shadow-lg transition-shadow hover:shadow-xl ${className ?? ''}`}
    >
      {/* Header mit Gruppe und Datum */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
            style={{ backgroundColor: groupColor, color: groupTextColor }}
          >
            {groupName}
          </span>
          {important && (
            <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
              Wichtig
            </span>
          )}
        </div>
        <span className="text-[#ff9900] text-sm font-medium">
          {createdAt && !isNaN(new Date(createdAt).getTime())
            ? formatDateBerlin(createdAt, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            : ''}
        </span>
      </div>
      
      {/* Content */}
      <div className="text-white/90 text-sm font-normal whitespace-pre-wrap leading-relaxed mb-3">
        {content}
      </div>
      
      {/* Reaktionen: Immer alle Buttons anzeigen */}
      {(reactions || onReact) && (
        <div className="flex gap-2 flex-wrap min-h-[40px] items-start">
          {Object.keys(REACTION_EMOJIS).map((type) => {
            const reactionType = type as ReactionType;
            const count = reactions?.counts[reactionType] || 0;
            const hasReacted = reactions?.userReaction === reactionType;
            
            return (
              <button
                key={reactionType}
                type="button"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 h-8 ${
                  hasReacted 
                    ? 'border-[#ff9900] bg-[#ff9900]/20 text-[#ff9900] border-2' 
                    : 'border-white/30 text-white/70 hover:border-[#ff9900]/50 hover:text-[#ff9900]/80'
                } ${
                  isOffline || !onReact 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-[#ff9900]/10 cursor-pointer'
                }`}
                onClick={isOffline || !onReact ? undefined : () => onReact(reactionType)}
                disabled={isOffline || !onReact}
                aria-label={`Reagiere mit ${REACTION_EMOJIS[reactionType]}`}
                title={isOffline ? 'Offline - Reagieren nicht möglich' : `Reagiere mit ${REACTION_EMOJIS[reactionType]}`}
              >
                <span className="text-base">{REACTION_EMOJIS[reactionType]}</span>
                {count > 0 && <span className="text-xs font-semibold">{count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnnouncementEventCard; 