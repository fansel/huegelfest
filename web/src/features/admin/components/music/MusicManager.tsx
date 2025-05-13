"use client";

import React, { useState, useEffect } from 'react';
import { getAllTracks, MusicEntry } from '@/features/music/actions/getAllTracks';
import { addTrack } from '@/features/music/actions/addTrack';
import { removeTrack } from '@/features/music/actions/removeTrack';
import { Music, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Modal from '@/shared/components/Modal';
import { toast } from 'react-hot-toast';

const MusicManager: React.FC = () => {
  const [tracks, setTracks] = useState<MusicEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Lädt alle Tracks
  const fetchTracks = async () => {
    setLoading(true);
    try {
      const data = await getAllTracks();
      setTracks(data);
    } catch (e) {
      toast.error('Fehler beim Laden der Musik!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTracks(); }, []);

  // Track hinzufügen
  const handleAdd = async () => {
    if (!newUrl.trim()) {
      toast.error('Bitte gib eine SoundCloud-URL ein!');
      return;
    }
    setAddLoading(true);
    try {
      await addTrack(newUrl.trim());
      toast.success('Track erfolgreich hinzugefügt!');
      setNewUrl('');
      setShowAdd(false);
      fetchTracks();
    } catch (e) {
      toast.error('Fehler beim Hinzufügen der Musik!');
    } finally {
      setAddLoading(false);
    }
  };

  // Track entfernen
  const handleRemove = async (id: string) => {
    setLoading(true);
    try {
      await removeTrack(id);
      toast.success('Track gelöscht!');
      fetchTracks();
    } catch (e) {
      toast.error('Fehler beim Entfernen der Musik!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[60vh] pb-24">
      <h2 className="text-xl font-bold mb-4 text-[#460b6c] text-center tracking-tight flex items-center justify-center gap-2">
        <Music /> Musik-Tracks
      </h2>
      {loading ? (
        <div className="text-center text-gray-400 py-8">Lade Musik...</div>
      ) : (
        <ul className="space-y-4 px-2 sm:px-0">
          {tracks.map(track => (
            <li
              key={track._id}
              className="bg-white/90 shadow-lg rounded-2xl px-4 py-3 flex items-center justify-between transition-all duration-200 hover:scale-[1.01]"
              style={{ boxShadow: `0 2px 12px 0 #ff990033` }}
            >
              <div className="flex items-center gap-3">
                {track.coverArtData && track.coverArtMimeType && (
                  <Image
                    src={`data:${track.coverArtMimeType};base64,${track.coverArtData}`}
                    alt={track.trackInfo.title + ' Cover'}
                    width={48}
                    height={48}
                    className="rounded shadow object-cover flex-shrink-0"
                  />
                )}
                <div>
                  <div className="font-medium text-gray-800">{track.trackInfo.title}</div>
                  <div className="text-xs text-gray-600">{track.trackInfo.author_name}</div>
                </div>
              </div>
              <button
                onClick={() => handleRemove(track._id)}
                disabled={loading}
                className="rounded-full bg-red-50 hover:bg-red-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 focus:outline-none border border-red-100 disabled:opacity-50"
                aria-label="Löschen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* Floating Action Button */}
      <div className="mt-6 flex justify-center mb-6">
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-full bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl w-12 h-12 flex items-center justify-center text-2xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition border-2 border-white"
          aria-label="Neuen Track hinzufügen"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Neuen Track hinzufügen">
        <div className="flex flex-col gap-6 items-center justify-center py-4 px-2">
          <input
            type="text"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="SoundCloud-URL"
            className="border-b-2 border-[#ff9900] focus:outline-none px-2 py-2 text-lg rounded w-full bg-gray-50"
            disabled={addLoading}
          />
          <button
            onClick={handleAdd}
            className="bg-[#ff9900] text-white px-6 py-2 rounded-full text-lg font-bold shadow hover:bg-orange-600 active:scale-95 transition w-full"
            disabled={addLoading}
          >
            {addLoading ? 'Hinzufügen...' : 'Track anlegen'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default MusicManager; 