'use client';

import React, { useState } from 'react';
import type { Category, Event, Day } from '../types/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';

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
    // Validierung
    if (!title.trim()) {
      setError('Bitte gib einen Titel an.');
      return;
    }
    if (!time.match(/^\d{2}:\d{2}$/)) {
      setError('Bitte gib eine gültige Uhrzeit im Format HH:MM an.');
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
        <div className="flex flex-col gap-6 items-center justify-center py-8 pb-4 h-full">
          <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto flex flex-col gap-4 px-4 flex-1">
            <label className="text-sm font-medium text-gray-700">Titel*</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={80}
            />
            <label className="text-sm font-medium text-gray-700">Tag*</label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={dayId}
              onChange={e => setDayId(e.target.value)}
              required
            >
              <option value="">Bitte wählen...</option>
              {days.map(day => (
                <option key={String(day._id)} value={String(day._id)}>{day.title}</option>
              ))}
            </select>
            <label className="text-sm font-medium text-gray-700">Uhrzeit* (HH:MM)</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={time}
              onChange={e => setTime(e.target.value)}
              placeholder="z.B. 18:30"
              required
              pattern="^\d{2}:\d{2}$"
              maxLength={5}
            />
            <label className="text-sm font-medium text-gray-700">Kategorie*</label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              required
            >
              <option value="">Bitte wählen...</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.label}</option>
              ))}
            </select>
            <label className="text-sm font-medium text-gray-700">Beschreibung</label>
            <textarea
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <label className="text-sm font-medium text-gray-700">Angeboten von</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={offeredBy}
              onChange={e => setOfferedBy(e.target.value)}
              maxLength={80}
              placeholder="z.B. Max Mustermann oder Gruppe XY"
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
                className="bg-[#ff9900] text-[#460b6c] font-semibold px-4 py-2 rounded-md hover:bg-[#ff9900]/90 transition"
                disabled={loading}
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