import { useState, useEffect } from 'react';
import { FaMusic, FaPlus, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import Image from 'next/image';

interface TrackInfo {
  title: string;
  author_name: string;
  thumbnail_url: string;
  author_url: string;
  description: string;
  html: string;
}

interface MusicEntry {
  url: string;
  trackInfo: TrackInfo;
}

export default function MusicManager() {
  const [musicEntries, setMusicEntries] = useState<MusicEntry[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMusic();
  }, []);

  const loadMusic = async () => {
    try {
      const response = await fetch('/api/music');
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Musik');
      }
      const data = await response.json();
      setMusicEntries(data);
    } catch (error) {
      console.error('Fehler beim Laden der Musik:', error);
      setError('Fehler beim Laden der Musik');
    }
  };

  const handleAddUrl = async () => {
    if (!newUrl.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: newUrl.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Hinzufügen der Musik');
      }

      await loadMusic();
      setNewUrl('');
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Musik:', error);
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUrl = async (url: string) => {
    try {
      const response = await fetch('/api/music', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Entfernen der Musik');
      }

      await loadMusic();
    } catch (error) {
      console.error('Fehler beim Entfernen der Musik:', error);
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <FaMusic className="mr-2" />
        Musik-URLs verwalten
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="SoundCloud-URL eingeben"
            className="flex-1 p-1.5 border rounded text-sm"
            disabled={loading}
          />
          <button
            onClick={handleAddUrl}
            disabled={loading}
            className="bg-red-500 text-[#460b6c] w-8 h-8 rounded hover:bg-red-600 flex items-center justify-center disabled:opacity-50"
          >
            <FaPlus size={14} />
          </button>
        </div>
        <div className="space-y-4">
          {musicEntries.map((entry) => (
            <div key={entry.url} className="bg-gray-50 p-4 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 relative flex-shrink-0">
                    <Image
                      src={entry.trackInfo.thumbnail_url}
                      alt={entry.trackInfo.title}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        target.parentElement?.classList.add('bg-gradient-to-br', 'from-purple-500', 'to-pink-500');
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{entry.trackInfo.title}</h3>
                    <p className="text-sm text-gray-600">{entry.trackInfo.author_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveUrl(entry.url)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 