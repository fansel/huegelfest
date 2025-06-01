"use client";

import React, { useState, useEffect } from 'react';
import { getAllTracks, MusicEntry } from '@/features/music/actions/getAllTracks';
import { addTrack } from '@/features/music/actions/addTrack';
import { removeTrack } from '@/features/music/actions/removeTrack';
import { validateSoundCloudUrl } from '@/features/music/actions/validateSoundCloudUrl';
import { Music, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';

interface MusicManagerClientProps {
  initialTracks?: MusicEntry[];
}

export const MusicManagerClient: React.FC<MusicManagerClientProps> = ({ initialTracks }) => {
  const [tracks, setTracks] = useState<MusicEntry[]>(initialTracks || []);
  const [loading, setLoading] = useState(!initialTracks); // No loading if initial data provided
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';


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

  // Initialize with SSR data, no need to fetch again
  useEffect(() => {
    if (initialTracks) {
      setTracks(initialTracks);
    }
  }, [initialTracks]);

  // WebSocket: Füge neuen Track hinzu, wenn Topic 'music-new-track'
  useGlobalWebSocket({
    topicFilter: ['music-new-track'],
    onMessage: (msg) => {
      if (msg.topic === 'music-new-track') {
        const newTrack = msg.payload as MusicEntry;
        setTracks((prev) => {
          if (prev.some(t => t._id === newTrack._id)) return prev;
          return [...prev, newTrack];
        });
      }
    }
  });

  const handleAdd = async () => {
    if (!newUrl.trim()) {
      toast.error('Bitte gib eine SoundCloud-URL ein!');
      return;
    }
    
    // URL-Validierung vor dem Hinzufügen
    const validation = await validateSoundCloudUrl(newUrl.trim());
    if (!validation.isValid) {
      toast.error(validation.errorMessage || 'Ungültige URL');
      if (validation.suggestion) {
        toast(validation.suggestion, { 
          duration: 4000,
          icon: '💡'
        });
      }
      return;
    }
    
    // Immediately reset form and show success
    const urlToAdd = newUrl.trim();
    setNewUrl('');
    setShowAdd(false);
    toast.success('Track wird hinzugefügt...');
    
    // Add track in background - WebSocket will handle the update
    try {
      await addTrack(urlToAdd);
      toast.success('Track erfolgreich hinzugefügt!');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Fehler beim Hinzufügen der Musik!';
      toast.error(errorMessage);
      // Reopen form on error
      setNewUrl(urlToAdd);
      if (isMobile) setShowAdd(true);
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
    !isMobile ? (
      <div className="relative min-h-[60vh] pb-24 flex flex-col max-w-5xl mx-auto">
        {/* Gemeinsame Header-Row */}
        <div className="flex flex-row items-center gap-8 mt-8 mb-6">
          <h2 className="text-xl font-bold text-[#460b6c] flex-1">Neuen Track hinzufügen</h2>
          <h2 className="text-xl font-bold text-[#460b6c] flex-1 text-center flex items-center gap-2"><Music /> Musik-Tracks</h2>
        </div>
        <div className="flex flex-row gap-4 justify-center">
          {/* Linke Spalte: Panel für neuen Track */}
          <div className="w-full max-w-lg flex-shrink-0">
            <div className="bg-white/90 rounded-2xl shadow-2xl border-2 border-gray-300 p-6 sticky top-8">
              <div className="flex flex-col gap-6">
                <Input
                  type="text"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="SoundCloud-URL"
                  className="w-full"
                  autoFocus
                />
                <Button
                  className="bg-[#ff9900] text-white w-full"
                  onClick={handleAdd}
                >
                  Track anlegen
                </Button>
              </div>
            </div>
          </div>
          {/* Rechte Spalte: Track-Liste */}
          <div className="flex-1 min-w-0 flex justify-center">
            <div className="space-y-4 px-2 sm:px-0 max-w-2xl w-full mx-auto">
              {loading ? (
                <div className="text-center text-gray-400 py-8">Lade Musik...</div>
              ) : (
                <ul className="space-y-4">
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
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(track._id)}
                        aria-label="Löschen"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
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
      </div>
    ) : (
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
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(track._id)}
                  aria-label="Löschen"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {/* Floating Action Button */}
        <div className="mt-6 flex justify-center mb-6">
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
        {/* Add Sheet */}
        <Sheet open={showAdd} onOpenChange={setShowAdd}>
          <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[40vh]">
            <SheetHeader>
              <SheetTitle>Neuen Track hinzufügen</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 items-center justify-center py-4 px-2">
              <Input
                type="text"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="SoundCloud-URL"
                className="w-full"
                autoFocus
              />
              <Button
                className="bg-[#ff9900] text-white w-full"
                onClick={handleAdd}
              >
                Track anlegen
              </Button>
            </div>
          </SheetContent>
        </Sheet>
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
    )
  );
};

export default MusicManagerClient; 