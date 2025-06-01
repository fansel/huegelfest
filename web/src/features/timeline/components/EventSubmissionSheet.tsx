'use client';

import React, { useState, useMemo } from 'react';
import type { Category, Event, Day } from '../types/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export interface EventSubmissionSheetProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  days: Day[];
  onSubmit: (event: Omit<Event, '_id' | 'favorite' | 'status' | 'moderationComment' | 'submittedAt' | 'submittedByAdmin'> & { dayId: string }) => Promise<void>;
}

/**
 * Sheet-Komponente für das Einreichen eines neuen Events durch Nutzer.
 * Validiert Eingaben und gibt Fehler/Erfolgsmeldungen aus.
 * Deaktiviert sich automatisch im Offline-Modus.
 * Zeigt nur aktive Tage an (Setup/Breakdown-Tage mit isActive: false werden ausgeblendet).
 */
export const EventSubmissionSheet: React.FC<EventSubmissionSheetProps> = ({ open, onClose, categories, days, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [dayId, setDayId] = useState('');
  const [offeredBy, setOfferedBy] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const isOnline = useNetworkStatus();

  // Filter only active days for user event submission
  const activeDays = useMemo(() => {
    return days.filter(day => {
      // If isActive property exists, only show active days
      // If isActive doesn't exist (backward compatibility), show all days
      return day.isActive !== false;
    });
  }, [days]);

  const resetForm = () => {
    setTitle('');
    setTime('');
    setCategoryId('');
    setDescription('');
    setDayId('');
    setOfferedBy('');
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Offline-Prüfung
    if (!isOnline) {
      setError('Event-Einreichung ist nur online möglich. Bitte stelle eine Internetverbindung her.');
      return;
    }
    
    // Validierung
    if (!title.trim()) {
      setError('Bitte gib einen Titel an.');
      return;
    }
    if (!time) {
      setError('Bitte gib eine Uhrzeit an.');
      return;
    }
    if (!categoryId) {
      setError('Bitte wähle eine Kategorie.');
      return;
    }
    if (!dayId) {
      setError('Bitte wähle einen Tag.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        time: time.trim(),
        categoryId,
        description: description.trim(),
        dayId,
        ...(offeredBy.trim() ? { offeredBy: offeredBy.trim() } : {}),
      });
      setSuccess(true);
      resetForm();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Einreichen des Events.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl max-h-[100svh] min-h-[300px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <span className="text-xl font-semibold text-[#460b6c]">Event vorschlagen</span>
          </SheetTitle>
        </SheetHeader>
        
        {/* Offline-Warnung */}
        {!isOnline && (
          <div className="mx-4 mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-2">
            <WifiOff className="text-orange-500" size={20} />
            <div>
              <p className="text-orange-600 font-medium text-sm">Offline-Modus</p>
              <p className="text-orange-600/80 text-xs">Event-Einreichung benötigt eine Internetverbindung</p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-6 items-center justify-center py-8 pb-4 h-full">
          <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto flex flex-col gap-4 px-4 flex-1">
            <label className="text-sm font-medium text-gray-700">Titel*</label>
            <input
              type="text"
              className={`mt-1 block w-full border border-gray-300 rounded-md p-2 ${
                !isOnline ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={80}
              disabled={!isOnline}
            />
            <label className="text-sm font-medium text-gray-700">Tag*</label>
            <select
              className={`mt-1 block w-full border border-gray-300 rounded-md p-2 ${
                !isOnline ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              value={dayId}
              onChange={e => setDayId(e.target.value)}
              required
              disabled={!isOnline}
            >
              <option value="">Bitte wählen...</option>
              {activeDays.map(day => (
                <option key={String(day._id)} value={String(day._id)}>{day.title}</option>
              ))}
            </select>
            {activeDays.length === 0 && (
              <div className="text-sm text-gray-500 mt-1">
                Aktuell sind keine Tage für Event-Einreichungen verfügbar.
              </div>
            )}
            <label className="text-sm font-medium text-gray-700">Uhrzeit* (HH:MM)</label>
            <input
              type="time"
              className={`mt-1 block w-full border border-gray-300 rounded-md p-2 text-base focus:outline-none focus:ring-2 focus:ring-[#ff9900] focus:border-transparent ${
                !isOnline ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              value={time}
              onChange={e => setTime(e.target.value)}
              required
              disabled={!isOnline}
            />
            <label className="text-sm font-medium text-gray-700">Kategorie*</label>
            <select
              className={`mt-1 block w-full border border-gray-300 rounded-md p-2 ${
                !isOnline ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              required
              disabled={!isOnline}
            >
              <option value="">Bitte wählen...</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.label}</option>
              ))}
            </select>
            <label className="text-sm font-medium text-gray-700">Beschreibung</label>
            <textarea
              className={`mt-1 block w-full border border-gray-300 rounded-md p-2 ${
                !isOnline ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={!isOnline}
            />
            <label className="text-sm font-medium text-gray-700">Angeboten von</label>
            <input
              type="text"
              className={`mt-1 block w-full border border-gray-300 rounded-md p-2 ${
                !isOnline ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              value={offeredBy}
              onChange={e => setOfferedBy(e.target.value)}
              maxLength={80}
              placeholder="z.B. Max Mustermann oder Gruppe XY"
              disabled={!isOnline}
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">Event wurde eingereicht und wird geprüft.</div>}
            <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white pb-4 z-10">
              <button
                type="button"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                onClick={onClose}
                disabled={loading}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-md font-semibold transition ${
                  !isOnline || activeDays.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#ff9900] text-[#460b6c] hover:bg-[#ff9900]/90'
                }`}
                disabled={loading || !isOnline || activeDays.length === 0}
              >
                {loading ? 'Wird gesendet...' : 'Event einreichen'}
              </button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}; 