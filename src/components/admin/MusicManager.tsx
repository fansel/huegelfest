'use client';

import { useState } from 'react';

interface MusicManagerProps {
  musicUrls: string[];
  onSave: (urls: string[]) => void;
}

export default function MusicManager({ musicUrls, onSave }: MusicManagerProps) {
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');

  const validateSoundCloudUrl = (url: string) => {
    return url.includes('soundcloud.com');
  };

  const handleAddUrl = () => {
    if (!newUrl.trim()) {
      setError('Bitte gib eine URL ein');
      return;
    }

    if (!validateSoundCloudUrl(newUrl)) {
      setError('Bitte gib eine gültige SoundCloud URL ein');
      return;
    }

    const updatedUrls = [...musicUrls, newUrl.trim()];
    onSave(updatedUrls);
    setNewUrl('');
    setError('');
  };

  const handleDeleteUrl = (index: number) => {
    const updatedUrls = musicUrls.filter((_, i) => i !== index);
    onSave(updatedUrls);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          SoundCloud URL hinzufügen
        </h2>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="SoundCloud URL eingeben"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#460b6c]"
          />
          <button
            onClick={handleAddUrl}
            className="px-4 py-2 bg-[#460b6c] text-white rounded-md hover:bg-[#5a0d8a] transition-colors"
          >
            Hinzufügen
          </button>
        </div>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Aktuelle SoundCloud URLs</h2>
        {musicUrls.length === 0 ? (
          <p className="text-gray-500">Keine URLs vorhanden</p>
        ) : (
          <div className="space-y-2">
            {musicUrls.map((url, index) => (
              <div
                key={index}
                className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center"
              >
                <p className="text-gray-900 break-all">{url}</p>
                <button
                  onClick={() => handleDeleteUrl(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  Löschen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 