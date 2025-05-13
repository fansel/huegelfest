import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

interface AnnouncementCardProps {
  content: string;
  groupName: string;
  groupColor?: string;
  important?: boolean;
  createdAt?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isLoadingDelete?: boolean;
}

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  content,
  groupName,
  groupColor = '#ff9900',
  important,
  createdAt,
  onEdit,
  onDelete,
  isLoadingDelete,
}) => (
  <div
    className="bg-white/80 backdrop-blur-md p-3 rounded-xl shadow-[0_2px_8px_0_rgba(70,11,108,0.08)] border border-white/30 flex flex-col gap-2 relative transition-shadow hover:shadow-xl"
    style={{ borderLeft: `8px solid ${groupColor}` }}
  >
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs text-gray-500 font-medium">
        {createdAt && !isNaN(new Date(createdAt).getTime())
          ? dateFormatter.format(new Date(createdAt))
          : ''}
      </span>
      {(onEdit || onDelete) && (
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="rounded-full bg-blue-50 hover:bg-blue-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-800 focus:outline-none border border-blue-100"
              aria-label="Bearbeiten"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded-full bg-red-50 hover:bg-red-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 focus:outline-none border border-red-100"
              aria-label="Löschen"
              disabled={isLoadingDelete}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
    <div className="flex items-center gap-2 mb-1">
      <span
        className="inline-block px-2 py-0.5 text-xs font-semibold rounded shadow-sm"
        style={{ backgroundColor: groupColor, color: '#fff' }}
      >
        {groupName}
      </span>
      {important && (
        <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded shadow-sm">
          Wichtig
        </span>
      )}
    </div>
    <p className="text-gray-900 text-sm font-normal whitespace-pre-wrap leading-snug">
      {content}
    </p>
  </div>
); 