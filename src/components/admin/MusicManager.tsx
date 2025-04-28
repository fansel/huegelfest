'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaTrash, FaPlus } from 'react-icons/fa';
import Image from 'next/image';

interface TrackInfo {
  title: string;
  artist: string;
  coverUrl: string;
  permalink: string;
  id: string;
}

interface MusicManagerProps {
  musicUrls: string[];
  onSave: (urls: string[]) => void;
}

export default function MusicManager({ musicUrls, onSave }: MusicManagerProps) {
  const [newUrl, setNewUrl] = useState('');
  const [trackInfos, setTrackInfos] = useState<Record<string, TrackInfo>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateUrl = (url: string): boolean => {
    return url.includes('soundcloud.com');
  };

  const extractTrackId = useCallback((url: string): string | null => {
    const match = url.match(/soundcloud\.com\/[^/]+\/([^/?]+)/);
    return match ? match[1] : null;
  }, []);

  const fetchTrackInfo = useCallback(async (url: string): Promise<TrackInfo | null> => {
    const trackId = extractTrackId(url);
    if (!trackId) return null;

    try {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      const trackInfo: TrackInfo = {
        title: data.title,
        artist: data.author_name,
        coverUrl: data.thumbnail_url,
        permalink: data.permalink_url,
        id: trackId
      };

      return trackInfo;
    } catch (error) {
      console.error('Fehler beim Abrufen der Track-Informationen:', error);
      return null;
    }
  }, [extractTrackId]);

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
    if (!validateUrl(newUrl)) {
      alert('Bitte geben Sie eine gültige SoundCloud-URL ein.');
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
      const infos = await Promise.all(urlsToAdd.map(url => fetchTrackInfo(url)));
      const filteredInfos = infos.filter((info): info is TrackInfo => info !== null);
      setTrackInfos(prev => ({ ...prev, ...filteredInfos.reduce((acc, info) => ({ ...acc, [info.id]: info }), {}) }));
      
      setNewUrl('');
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUrl = (urlToDelete: string) => {
    const updatedUrls = musicUrls.filter(url => url !== urlToDelete);
    onSave(updatedUrls);
    
    const trackId = extractTrackId(urlToDelete);
    if (trackId) {
      const updatedTrackInfos = { ...trackInfos };
      delete updatedTrackInfos[trackId];
      setTrackInfos(updatedTrackInfos);
    }
  };

  useEffect(() => {
    const loadTrackInfos = async () => {
      const infos = await Promise.all(
        musicUrls.map(async (url) => {
          try {
            return await fetchTrackInfo(url);
          } catch {
            return null;
          }
        })
      );

      const validInfos = infos.filter((info): info is TrackInfo => info !== null);
      const infoMap = validInfos.reduce<Record<string, TrackInfo>>(
        (acc, info) => ({ ...acc, [info.id]: info }),
        {}
      );
      
      setTrackInfos(infoMap);
    };

    loadTrackInfos();
  }, [musicUrls, fetchTrackInfo]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto">
      <h3 className="text-lg sm:text-xl font-bold text-[#460b6c] mb-4 sticky top-0 bg-white z-10 pb-2">Musik verwalten</h3>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-md sm:text-lg font-semibold text-[#460b6c] mb-3">
            SoundCloud Track oder Playlist hinzufügen
          </h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="SoundCloud URL (Track oder Playlist) eingeben"
              className="flex-1 p-2 border border-gray-300 rounded text-sm sm:text-base bg-white text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={handleAddUrl}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 bg-[#ff9900] text-white rounded-md hover:bg-orange-600 transition-colors text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50"
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
        </div>

        <div className="space-y-4">
          <h4 className="text-md sm:text-lg font-semibold text-[#460b6c] sticky top-0 bg-white z-10 pb-2">Aktuelle Tracks</h4>
          {musicUrls.length === 0 ? (
            <p className="text-gray-500">Keine Tracks vorhanden</p>
          ) : (
            <div className="space-y-3">
              {musicUrls.map((url, index) => {
                const trackId = extractTrackId(url);
                const trackInfo = trackId ? trackInfos[trackId] : null;
                return (
                  <div
                    key={index}
                    className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {trackInfo?.coverUrl && (
                        <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                          <Image
                            src={trackInfo.coverUrl}
                            alt={trackInfo.title}
                            fill
                            className="rounded object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h3 className="font-medium text-gray-700 text-sm sm:text-base truncate">
                              {trackInfo?.title || 'Lade Track-Informationen...'}
                            </h3>
                            <p className="text-gray-500 text-xs sm:text-sm truncate">
                              {trackInfo?.artist || 'Unbekannter Künstler'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteUrl(url)}
                            className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 text-sm sm:text-base flex-shrink-0 transition-colors"
                            title="Track löschen"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <a
                          href={trackInfo?.permalink || url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm mt-1 sm:mt-2 inline-block transition-colors truncate block"
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
    </div>
  );
} 