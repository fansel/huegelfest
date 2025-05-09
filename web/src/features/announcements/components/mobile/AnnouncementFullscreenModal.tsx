import React from 'react';
import AnnouncementForm from '../desktop/AnnouncementForm';
import { IAnnouncement } from '@/shared/types/types';


interface Group {
  id: string;
  name: string;
  color: string;
}

interface AnnouncementFullscreenModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (announcement: Partial<IAnnouncement>) => Promise<void>;
  isSubmitting: boolean;
  announcement?: Partial<IAnnouncement>;
  groups?: Group[];
}

const AnnouncementFullscreenModal: React.FC<AnnouncementFullscreenModalProps> = ({
  open,
  onClose,
  onSave,
  isSubmitting,
  announcement,
  groups = [],
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/10 flex items-end justify-center">
      {/* Moderner Bottom Sheet-Container */}
      <div className="w-full max-w-lg mx-auto rounded-t-3xl shadow-[0_8px_40px_0_rgba(70,11,108,0.18)] border border-white/30 bg-white/80 backdrop-blur-xl flex flex-col overflow-hidden animate-modern-sheet h-[85vh]">
        {/* Drag Handle */}
        <div className="flex justify-center pt-4 pb-2 bg-transparent rounded-t-3xl">
          <div className="w-16 h-1.5 bg-gray-300/80 rounded-full shadow-sm" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-transparent">
          <span className="text-xl font-bold text-[#460b6c] tracking-tight">
            {announcement?.id ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}
          </span>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-white/90 text-gray-500 hover:text-[#460b6c] text-2xl font-bold focus:outline-none shadow transition-colors"
            aria-label="Schließen"
          >
            ×
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <AnnouncementForm
            onSave={onSave}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            announcement={announcement}
            groups={groups}
          />
        </div>
      </div>
      <style jsx global>{`
        @keyframes modern-sheet {
          0% { transform: translateY(100%) scale(0.98); opacity: 0.7; }
          80% { transform: translateY(-8px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-modern-sheet {
          animation: modern-sheet 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </div>
  );
};

export default AnnouncementFullscreenModal; 