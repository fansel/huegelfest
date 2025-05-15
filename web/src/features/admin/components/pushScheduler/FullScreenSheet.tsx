import React, { useRef, useId } from 'react';
import { ArrowLeft } from 'lucide-react';

interface FullScreenSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const SWIPE_THRESHOLD = 60;

const FullScreenSheet: React.FC<FullScreenSheetProps> = ({ open, onClose, title, children }) => {
  const titleId = useId();
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  const swiped = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchCurrentX.current = e.touches[0].clientX;
      swiped.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current !== null && e.touches.length === 1) {
      touchCurrentX.current = e.touches[0].clientX;
      const deltaX = touchCurrentX.current - touchStartX.current;
      if (deltaX > SWIPE_THRESHOLD && !swiped.current) {
        swiped.current = true;
        onClose();
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchCurrentX.current = null;
    swiped.current = false;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      className={`fixed inset-0 z-50 flex items-stretch justify-end pointer-events-none select-none`}
      style={{ visibility: open ? 'visible' : 'hidden' }}
    >
      {/* Overlay (optional: leicht abgedunkelt) */}
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet */}
      <div
        className={`relative w-full h-full max-w-full bg-white shadow-xl flex flex-col transition-transform duration-300 pointer-events-auto select-auto
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ willChange: 'transform' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center h-14 px-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center text-gray-600 hover:text-[#460b6c] focus:outline-none mr-2"
            aria-label="Zurück"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {title && (
            <h2 id={titleId} className="flex-1 text-center font-semibold text-base text-[#460b6c] truncate">
              {title}
            </h2>
          )}
          {/* Platzhalter für zentrierten Titel */}
          <div className="w-8" />
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-0 py-2 sm:px-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FullScreenSheet; 