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
}) => {
  const groupTextColor = getContrastTextColor(groupColor);
  return (
    <div
      className={`bg-[#460b6c]/50 backdrop-blur-sm border-2 rounded-xl p-4 shadow-lg flex flex-col gap-2 relative transition-shadow hover:shadow-xl ${className ?? ''}`}
      style={{ borderColor: groupColor }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block px-2 py-0.5 text-xs font-semibold rounded shadow-sm border"
            style={{ backgroundColor: groupColor, color: groupTextColor, borderColor: groupColor }}
          >
            {groupName}
          </span>
          {important && (
            <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded shadow-sm ml-2">
              Wichtig
            </span>
          )}
        </div>
        <span className="text-xs text-white/60 font-medium">
          {createdAt && !isNaN(new Date(createdAt).getTime())
            ? formatDateBerlin(createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : ''}
        </span>
      </div>
      <div className="text-white text-sm font-normal whitespace-pre-wrap leading-snug mb-1">
        {content}
      </div>
      {reactions && onReact && (
        <div className="flex gap-2 mt-2">
          {Object.keys(REACTION_EMOJIS).map((type) => {
            const reactionType = type as ReactionType;
            const count = reactions.counts[reactionType] || 0;
            const hasReacted = reactions.userReaction === reactionType;
            return (
              <button
                key={reactionType}
                type="button"
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-base font-semibold border transition-colors border-[#ff9900] text-[#ff9900] bg-transparent hover:bg-[#ff9900]/10 focus:outline-none ${hasReacted ? 'border-4' : 'border-2'}`}
                onClick={() => onReact(reactionType)}
                aria-label={`Reagiere mit ${REACTION_EMOJIS[reactionType]}`}
              >
                <span>{REACTION_EMOJIS[reactionType]}</span>
                <span className="text-xs">{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnnouncementEventCard; 