import React, { useState, useEffect } from 'react';
import { getAllTracks, MusicEntry } from '@/features/music/actions/getAllTracks';
import { addTrack } from '@/features/music/actions/addTrack';
import { removeTrack } from '@/features/music/actions/removeTrack';
import { Music, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';

const MusicManagerDesktop: React.FC = () => {
  const [tracks, setTracks] = useState<MusicEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    setDeleteDialogId(id);
  };

  const confirmDelete = async () => {
    if (!deleteDialogId) return;
    setLoading(true);
    try {
      await removeTrack(deleteDialogId);
      toast.success('Track gelöscht!');
      fetchTracks();
    } catch (e) {
      toast.error('Fehler beim Entfernen der Musik!');
    } finally {
      setDeleteDialogId(null);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#460b6c] tracking-tight flex items-center gap-2">
          <Music /> Musik-Tracks
        </h2>
        <Button
          variant="default"
          size="icon"
          onClick={() => setShowAdd(true)}
          aria-label="Neuen Track hinzufügen"
          className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
      {loading ? (
        <div className="text-center text-gray-400 py-8">Lade Musik...</div>
      ) : (
        <div className="bg-white rounded-xl shadow p-4">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[#460b6c]">
                <th className="py-2">Cover</th>
                <th className="py-2">Titel</th>
                <th className="py-2">Künstler</th>
                <th className="py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map(track => (
                <tr key={track._id} className="border-t">
                  <td className="py-2">
                    {track.coverArtData && track.coverArtMimeType ? (
                      <Image
                        src={`data:${track.coverArtMimeType};base64,${track.coverArtData}`}
                        alt={track.trackInfo.title + ' Cover'}
                        width={48}
                        height={48}
                        className="rounded shadow object-cover"
                      />
                    ) : (
                      <span className="inline-block w-12 h-12 rounded bg-gray-100" />
                    )}
                  </td>
                  <td className="py-2 font-medium text-gray-800">{track.trackInfo.title}</td>
                  <td className="py-2 text-gray-600">{track.trackInfo.author_name}</td>
                  <td className="py-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(track._id)}
                      aria-label="Löschen"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Track hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6 items-center justify-center py-4 px-2">
            <Input
              type="text"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="SoundCloud-URL"
              disabled={addLoading}
              className="w-full"
              autoFocus
            />
            <DialogFooter className="w-full flex-row justify-end gap-2">
              <DialogClose asChild>
                <Button variant="secondary" onClick={() => setShowAdd(false)}>Abbrechen</Button>
              </DialogClose>
              <Button
                className="bg-[#ff9900] text-white"
                onClick={handleAdd}
                disabled={addLoading}
              >
                {addLoading ? 'Hinzufügen...' : 'Track anlegen'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialogId} onOpenChange={open => { if (!open) setDeleteDialogId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diesen Track wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary" onClick={() => setDeleteDialogId(null)}>Abbrechen</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmDelete}>Löschen</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MusicManagerDesktop; 