import { useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

interface MusicManagerProps {
  musicUrls: string[];
  onSaveMusicUrls: (urls: string[]) => void;
}

const MusicManager = ({ musicUrls, onSaveMusicUrls }: MusicManagerProps) => {
  const [newUrl, setNewUrl] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddUrl = async () => {
    if (!newUrl.trim()) {
      alert('Bitte gib eine URL ein.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUrls = [...musicUrls, newUrl.trim()];
      await onSaveMusicUrls(updatedUrls);
      setNewUrl('');
      setIsAddingUrl(false);
    } catch (error) {
      console.error('Fehler beim Hinzufügen der URL:', error);
      alert('Die URL konnte nicht hinzugefügt werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUrl = async (index: number) => {
    setIsSubmitting(true);
    try {
      const updatedUrls = musicUrls.filter((_, i) => i !== index);
      await onSaveMusicUrls(updatedUrls);
    } catch (error) {
      console.error('Fehler beim Löschen der URL:', error);
      alert('Die URL konnte nicht gelöscht werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[#460b6c]">
          Musik-URLs
        </h3>
        <button
          onClick={() => setIsAddingUrl(!isAddingUrl)}
          className="p-2 text-[#ff9900] hover:text-[#ff9900]/80 transition-colors"
        >
          <FaPlus size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {musicUrls.map((url, index) => (
          <div
            key={`url-${index}`}
            className="bg-gray-50 p-3 rounded-lg border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 truncate block"
                >
                  {url}
                </a>
              </div>
              <button
                onClick={() => handleDeleteUrl(index)}
                disabled={isSubmitting}
                className="p-2 text-red-600 hover:text-red-800 flex-shrink-0 disabled:opacity-50"
              >
                <FaTrash size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAddingUrl && (
        <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="space-y-3">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={handleAddUrl}
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded bg-[#ff9900] text-white text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Wird gespeichert...' : 'URL hinzufügen'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicManager;
