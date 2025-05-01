import { useState, useEffect } from 'react';
import { FaMusic, FaPlus, FaTrash, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
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

interface PreviewData {
  url: string;
  trackInfo: TrackInfo;
  status: 'loading' | 'success' | 'error';
  message?: string;
}

export default function MusicManager() {
  const [musicEntries, setMusicEntries] = useState<MusicEntry[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingUrls, setDeletingUrls] = useState<Set<string>>(new Set());

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
      setMusicEntries(data.data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Musik:', error);
      setError('Fehler beim Laden der Musik');
    }
  };

  const fetchTrackInfo = async (url: string) => {
    try {
      const response = await fetch('/api/music/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Track-Informationen');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Track-Informationen:', error);
      throw error;
    }
  };

  const handleUrlChange = (url: string) => {
    setNewUrl(url);
    setPreviewData(null);
  };

  const handlePreview = async () => {
    if (!newUrl.trim()) return;

    if (!isValidSoundCloudUrl(newUrl)) {
      setPreviewData({ 
        url: newUrl, 
        trackInfo: {} as TrackInfo, 
        status: 'error', 
        message: 'Bitte geben Sie eine gültige SoundCloud-URL ein'
      });
      return;
    }

    setPreviewData({ url: newUrl, trackInfo: {} as TrackInfo, status: 'loading' });
    try {
      const trackInfo = await fetchTrackInfo(newUrl);
      if (!trackInfo.title || !trackInfo.author_name) {
        throw new Error('Ungültige Track-Informationen');
      }
      setPreviewData({ url: newUrl, trackInfo, status: 'success' });
    } catch (error) {
      console.error('Fehler beim Laden der Vorschau:', error);
      let errorMessage = 'Fehler beim Laden der Vorschau';
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = 'Track nicht gefunden';
        } else if (error.message.includes('403')) {
          errorMessage = 'Zugriff verweigert';
        } else if (error.message.includes('Ungültige Track-Informationen')) {
          errorMessage = 'Track-Informationen konnten nicht abgerufen werden';
        } else {
          errorMessage = error.message;
        }
      }
      
      setPreviewData({ 
        url: newUrl, 
        trackInfo: {} as TrackInfo, 
        status: 'error', 
        message: errorMessage
      });
    }
  };

  const handleAddUrl = async () => {
    if (!newUrl.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

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

      const result = await response.json();
      
      if (result.data) {
        setMusicEntries(prevEntries => {
          const exists = prevEntries.some(entry => entry.url === result.data.url);
          if (exists) {
            return prevEntries;
          }
          return [result.data, ...prevEntries];
        });
      }

      setNewUrl('');
      setSuccessMessage('Musik erfolgreich hinzugefügt!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Musik:', error);
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUrl = async (url: string) => {
    setDeletingUrls(prev => new Set(prev).add(url));
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

      setMusicEntries(prevEntries => prevEntries.filter(entry => entry.url !== url));
    } catch (error) {
      console.error('Fehler beim Entfernen der Musik:', error);
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setDeletingUrls(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
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

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <FaCheck className="mr-2" />
          {successMessage}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="SoundCloud-URL eingeben"
            className="flex-1 p-1.5 border rounded text-sm"
            disabled={loading}
          />
          <button
            onClick={handleAddUrl}
            disabled={loading || !newUrl.trim()}
            className="bg-red-500 text-[#460b6c] w-8 h-8 rounded hover:bg-red-600 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FaPlus size={14} />
            )}
          </button>
        </div>

        {previewData && (
          <div className={`bg-gray-50 p-4 rounded ${previewData.status === 'error' ? 'border border-red-400' : ''}`}>
            <div className="flex items-center space-x-4">
              {previewData.status === 'loading' ? (
                <div className="w-12 h-12 rounded bg-gray-200 animate-pulse" />
              ) : previewData.trackInfo.thumbnail_url ? (
                <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 relative flex-shrink-0">
                  <Image
                    src={previewData.trackInfo.thumbnail_url}
                    alt={previewData.trackInfo.title || 'Track Cover'}
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
              ) : (
                <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <FaMusic className="text-white" size={24} />
                </div>
              )}
              <div>
                <h3 className="font-medium">
                  {previewData.status === 'loading' ? 'Lade Vorschau...' : previewData.trackInfo.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {previewData.status === 'loading' ? 'Bitte warten...' : previewData.trackInfo.author_name}
                </p>
                {previewData.status === 'error' && (
                  <p className="text-sm text-red-600">{previewData.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {musicEntries.map((entry) => (
            <div key={entry.url} className="bg-gray-50 p-4 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 relative flex-shrink-0">
                    {entry.trackInfo.thumbnail_url ? (
                      <Image
                        src={entry.trackInfo.thumbnail_url}
                        alt={entry.trackInfo.title || 'Track Cover'}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          target.parentElement?.classList.add('bg-gradient-to-br', 'from-purple-500', 'to-pink-500');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <FaMusic className="text-white" size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{entry.trackInfo.title}</h3>
                    <p className="text-sm text-gray-600">{entry.trackInfo.author_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveUrl(entry.url)}
                  disabled={deletingUrls.has(entry.url)}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50 w-8 h-8 flex items-center justify-center"
                >
                  {deletingUrls.has(entry.url) ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaTrash />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 