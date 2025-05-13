"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { getAllTrackUrls } from '@/features/music/actions/getAllTrackUrls';
import { getTrackInfos, TrackInfo } from '@/features/music/actions/getTrackInfos';
import { addTrack } from '@/features/music/actions/addTrack';
import { removeTrack } from '@/features/music/actions/removeTrack';
import { FaMusic, FaPlus, FaTrash, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

export default function MusicManager() {
  const [trackInfos, setTrackInfos] = useState<TrackInfo[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadTrackInfos();
  }, []);

  const loadTrackInfos = async () => {
    setLoading(true);
    setError(null);
    try {
      const urls = await getAllTrackUrls();
      const infos = await getTrackInfos(urls);
      setTrackInfos(infos);
    } catch (e) {
      setError('Fehler beim Laden der Musik');
      console.error('Fehler beim Laden der Musik:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newUrl.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await addTrack(newUrl.trim());
      setNewUrl('');
      setSuccess('Track erfolgreich hinzugefügt!');
      await loadTrackInfos();
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setError('Fehler beim Hinzufügen der Musik');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      await removeTrack(url);
      await loadTrackInfos();
    } catch (e) {
      setError('Fehler beim Entfernen der Musik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <FaMusic className="mr-2" /> Musik-Manager
      </h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2 flex items-center">
          <FaExclamationTriangle className="mr-2" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-2 flex items-center">
          <FaCheck className="mr-2" /> {success}
        </div>
      )}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          placeholder="SoundCloud-URL eingeben"
          className="flex-1 p-2 border rounded text-sm"
          disabled={loading || isPending}
        />
        <button
          onClick={handleAdd}
          disabled={loading || isPending || !newUrl.trim()}
          className="bg-[#ff9900] text-white px-3 py-2 rounded hover:bg-orange-600 flex items-center justify-center disabled:opacity-50"
        >
          <FaPlus />
        </button>
      </div>
      {loading && <div className="text-gray-400 text-center py-2">Lade...</div>}
      <div className="space-y-2">
        {trackInfos.map((info) => (
          <div key={info.title + info.author_name} className="bg-gray-50 p-3 rounded flex items-center justify-between">
            <div>
              <div className="font-medium">{info.title}</div>
              <div className="text-xs text-gray-600">{info.author_name}</div>
            </div>
            <button
              onClick={() => handleRemove(info.html)} // html als Platzhalter für URL, ggf. anpassen
              disabled={loading || isPending}
              className="text-red-500 hover:text-red-700 w-8 h-8 flex items-center justify-center disabled:opacity-50"
            >
              <FaTrash />
            </button>
          </div>
        ))}
        {trackInfos.length === 0 && !loading && (
          <div className="text-gray-400 text-center py-4">Keine Musik-Tracks gefunden.</div>
        )}
      </div>
    </div>
  );
} 