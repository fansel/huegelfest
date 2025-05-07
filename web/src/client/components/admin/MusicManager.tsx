import { useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface MusicManagerProps {
  urls: string[];
  onSave: (urls: string[]) => Promise<void>;
}

const MusicManager = ({ urls, onSave }: MusicManagerProps) => {
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddUrl = async () => {
    if (!newUrl.trim()) {
      toast.error('Bitte gib eine URL ein.');
      return;
    }

    if (urls.includes(newUrl)) {
      toast.error('Diese URL existiert bereits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUrls = [...urls, newUrl.trim()];
      await onSave(updatedUrls);
      setNewUrl('');
    } catch (error) {
      console.error('Fehler beim Hinzufügen der URL:', error);
      toast.error('Die URL konnte nicht hinzugefügt werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUrl = async (url: string) => {
    setIsSubmitting(true);
    try {
      const updatedUrls = urls.filter((u) => u !== url);
      await onSave(updatedUrls);
    } catch (error) {
      console.error('Fehler beim Löschen der URL:', error);
      toast.error('Die URL konnte nicht gelöscht werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[#460b6c]">Musik-URLs verwalten</h3>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Neue Musik-URL"
            className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={handleAddUrl}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#ff9900] rounded hover:bg-orange-600 disabled:opacity-50"
          >
            <FaPlus className="inline-block mr-1" />
            Hinzufügen
          </button>
        </div>

        <div className="space-y-2">
          {urls.map((url) => (
            <div key={url} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700 truncate">{url}</span>
              <button
                onClick={() => handleDeleteUrl(url)}
                disabled={isSubmitting}
                className="text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MusicManager;