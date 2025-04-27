'use client';

import { useState, useEffect } from 'react';
import { FaPlay, FaPause, FaTrash, FaPlus } from 'react-icons/fa';
import Image from 'next/image';

interface TrackInfo {
  title: string;
  artist: string;
  coverUrl: string;
  permalink: string;
}

interface MusicManagerProps {
  musicUrls: string[];
  onSave: (urls: string[]) => void;
}

export default function MusicManager({ musicUrls, onSave }: MusicManagerProps) {
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');
  const [trackInfos, setTrackInfos] = useState<Record<string, TrackInfo>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateSoundCloudUrl = (url: string) => {
    // Unterstützt sowohl Desktop- als auch Mobile-Links
    return url.includes('soundcloud.com');
  };

  const extractTrackId = (url: string) => {
    // Extrahiert die Track-ID aus verschiedenen SoundCloud-URL-Formaten
    const match = url.match(/soundcloud\.com\/[^\/]+\/[^\/]+/);
    return match ? match[0] : null;
  };

  const fetchTrackInfo = async (url: string) => {
    try {
      const trackId = extractTrackId(url);
      if (!trackId) throw new Error('Ungültige SoundCloud URL');

      const response = await fetch(`https://soundcloud.com/oembed?url=https://${trackId}&format=json`);
      if (!response.ok) throw new Error('Fehler beim Abrufen der Track-Informationen');

      const data = await response.json();
      const trackInfo: TrackInfo = {
        title: data.title,
        artist: data.author_name,
        coverUrl: data.thumbnail_url,
        permalink: data.permalink_url
      };

      setTrackInfos(prev => ({ ...prev, [url]: trackInfo }));
    } catch (error) {
      console.error('Fehler beim Abrufen der Track-Informationen:', error);
    }
  };

  const fetchPlaylistTracks = async (playlistUrl: string) => {
    try {
      const response = await fetch(`https://soundcloud.com/oembed?url=${playlistUrl}&format=json`);
      if (!response.ok) throw new Error('Fehler beim Abrufen der Playlist-Informationen');

      const data = await response.json();
      // Extrahiere die Track-URLs aus dem HTML und konvertiere sie zu Strings
      const trackUrls = (data.html.match(/soundcloud\.com\/[^\/]+\/[^\/]+/g) || []) as string[];
      return [...new Set(trackUrls)]; // Entferne Duplikate
    } catch (error) {
      console.error('Fehler beim Abrufen der Playlist:', error);
      return [];
    }
  };

  const handleAddUrl = async () => {
    if (!newUrl.trim()) {
      setError('Bitte gib eine URL ein');
      return;
    }

    if (!validateSoundCloudUrl(newUrl)) {
      setError('Bitte gib eine gültige SoundCloud URL ein');
      return;
    }

    setIsLoading(true);
    try {
      let urlsToAdd: string[] = [];
      
      if (newUrl.includes('/sets/')) {
        // Es ist eine Playlist
        const trackUrls = await fetchPlaylistTracks(newUrl.trim());
        urlsToAdd = trackUrls;
      } else {
        // Es ist ein einzelner Track
        urlsToAdd = [newUrl.trim()];
      }

      const updatedUrls = [...musicUrls, ...urlsToAdd];
      onSave(updatedUrls);

      // Lade Track-Informationen für alle neuen URLs
      await Promise.all(urlsToAdd.map(url => fetchTrackInfo(url)));
      
      setNewUrl('');
      setError('');
    } catch (error) {
      setError('Fehler beim Hinzufügen der Tracks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUrl = (index: number) => {
    const updatedUrls = musicUrls.filter((_, i) => i !== index);
    onSave(updatedUrls);
  };

  useEffect(() => {
    // Lade Track-Informationen für alle vorhandenen URLs
    musicUrls.forEach(url => {
      if (!trackInfos[url]) {
        fetchTrackInfo(url);
      }
    });
  }, [musicUrls]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          SoundCloud Track oder Playlist hinzufügen
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="SoundCloud URL (Track oder Playlist) eingeben"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#460b6c] text-sm sm:text-base"
          />
          <button
            onClick={handleAddUrl}
            disabled={isLoading}
            className="px-4 py-2 bg-[#460b6c] text-white rounded-md hover:bg-[#5a0d8a] transition-colors text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              'Lädt...'
            ) : (
              <>
                <FaPlus />
                Hinzufügen
              </>
            )}
          </button>
        </div>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Aktuelle Tracks</h2>
        {musicUrls.length === 0 ? (
          <p className="text-gray-500">Keine Tracks vorhanden</p>
        ) : (
          <div className="space-y-2">
            {musicUrls.map((url, index) => {
              const trackInfo = trackInfos[url];
              return (
                <div
                  key={index}
                  className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {trackInfo?.coverUrl && (
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={trackInfo.coverUrl}
                          alt={trackInfo.title}
                          fill
                          className="rounded object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {trackInfo?.title || 'Lade Track-Informationen...'}
                          </h3>
                          <p className="text-gray-500 text-sm truncate">
                            {trackInfo?.artist || 'Unbekannter Künstler'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteUrl(index)}
                          className="p-2 text-red-600 hover:text-red-800 text-sm sm:text-base flex-shrink-0"
                          title="Track löschen"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <a
                        href={trackInfo?.permalink || url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#460b6c] hover:text-[#5a0d8a] text-xs sm:text-sm mt-2 inline-block"
                      >
                        Auf SoundCloud anhören
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 