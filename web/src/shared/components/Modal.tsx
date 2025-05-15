import React, { useEffect, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Generische Modal-Komponente für Popups.
 * - Zentriert, mit Overlay
 * - Schließt bei Klick auf Overlay oder ESC
 * - Optionaler Titel
 */
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const handleEsc = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, handleEsc]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className="bg-[#1a0033] rounded-lg shadow-lg p-6 min-w-[320px] max-w-full relative"
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h2 id="modal-title" className="mb-4 text-lg font-semibold text-[#ff9900]">{title}</h2>
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-[#ff9900] hover:text-white text-xl"
          aria-label="Schließen"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal; 