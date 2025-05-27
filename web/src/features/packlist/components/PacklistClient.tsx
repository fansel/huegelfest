'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Package, Plus, X, Check, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { PacklistItem } from '../types/PacklistItem';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { getGlobalPacklistAction } from '../actions/getGlobalPacklistAction';
import { useWebSocket, WebSocketMessage } from '@/shared/hooks/useWebSocket';
import { getWebSocketUrl } from '@/shared/utils/getWebSocketUrl';
import useSWR from 'swr';
import toast from 'react-hot-toast';

const LOCAL_STORAGE_KEY = 'userPacklist';

/**
 * Merge-Logik: Vereint globale und lokale Packliste.
 * - Neue globale Items werden hinzugefügt
 * - User-Items bleiben erhalten
 * - Gelöschte globale Items werden lokal als deleted markiert
 * - Check-Status bleibt erhalten
 */
function mergePacklists(
  global: PacklistItem[],
  local: PacklistItem[]
): PacklistItem[] {
  console.log('[Packlist] Merge - Global items:', global);
  console.log('[Packlist] Merge - Local items:', local);
  
  const localMap = new Map(local.map(item => [item.id, item]));
  const merged: PacklistItem[] = [];

  // Füge alle globalen Items hinzu (mit lokalem Status, falls vorhanden)
  for (const g of global) {
    const localItem = localMap.get(g.id);
    if (localItem) {
      merged.push({ ...g, checked: localItem.checked, deleted: localItem.deleted });
      localMap.delete(g.id);
    } else {
      merged.push({ ...g, checked: false });
    }
  }
  
  // Füge alle User-Items hinzu, die nicht in global existieren
  for (const item of localMap.values()) {
    // User-Items: id beginnt mit "user_"
    if (item.id.startsWith('user_')) {
      console.log('[Packlist] Behalte User-Item:', item);
      merged.push(item);
    } else {
      console.log('[Packlist] Überspringe gelöschtes Global-Item:', item);
    }
  }
  
  console.log('[Packlist] Merge-Ergebnis:', merged);
  return merged;
}

interface PacklistClientProps {
  initialItems: PacklistItem[];
}

export default function PacklistClient({ initialItems }: PacklistClientProps) {
  const [input, setInput] = useState<string>('');
  const isOnline = useNetworkStatus();

  // SWR Fetcher-Funktion: Lädt globale Items und merged sie mit lokalen
  const fetchPacklistData = useCallback(async (): Promise<PacklistItem[]> => {
    console.log('[Packlist] SWR Fetcher wird ausgeführt...');
    
    const globalItems = await getGlobalPacklistAction();
    const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    let localItems: PacklistItem[] = [];
    
    if (localRaw) {
      try {
        localItems = JSON.parse(localRaw);
        console.log('[Packlist] Lokale Items geladen:', localItems);
      } catch (e) {
        console.error('[Packlist] Fehler beim Parsen der lokalen Items:', e);
        localItems = [];
      }
    }
    
    const merged = mergePacklists(globalItems, localItems);
    console.log('[Packlist] Gemergte Items (SWR):', merged);
    
    // Speichere merged result in localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
    
    return merged;
  }, []);

  // SWR für Packlist-Daten
  const { data: items = [], mutate, isLoading } = useSWR<PacklistItem[]>(
    'packlist-data',
    fetchPacklistData,
    {
      fallbackData: [],
      revalidateOnFocus: false,
      refreshInterval: 0,
    }
  );

  // WebSocket-Integration für Live-Updates (wie InfoBoard)
  useWebSocket(
    getWebSocketUrl(),
    {
      onMessage: (msg: WebSocketMessage) => {
        console.log('[Packlist] WebSocket-Message empfangen:', msg);
        if (msg.topic === 'packlist-updated') {
          console.log('[Packlist] Packlist-Update erkannt, revalidiere Daten:', msg.payload);
          mutate(); // SWR Daten neu laden
        }
      },
      onOpen: () => {
        console.log('[Packlist] WebSocket verbunden');
      },
      onClose: () => {
        console.log('[Packlist] WebSocket getrennt');
      },
      onError: (err) => {
        console.error('[Packlist] WebSocket-Fehler:', err);
      },
      reconnectIntervalMs: 5000,
    }
  );

  const handleAdd = () => {
    if (input.trim().length === 0) return;
    const newItem: PacklistItem = {
      id: `user_${Date.now()}`, // Präfix für User-Items
      text: input.trim(),
      checked: false,
    };
    mutate(prev => prev ? [...prev, newItem] : [newItem], false);
    setInput('');
    toast.success('Item hinzugefügt!');
  };

  const handleCheck = (id: string) => {
    mutate(prev => prev ? prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ) : [], false);
  };

  const handleDelete = (id: string) => {
    // Nur User-Items können gelöscht werden
    mutate(prev => prev ? prev.filter(item => item.id !== id) : [], false);
    toast.success('Item entfernt!');
  };

  const activeItems = (items || []).filter(item => !item.deleted);
  const checkedCount = activeItems.filter(item => item.checked).length;
  const totalCount = activeItems.length;
  const progressPercent = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="py-12 text-center text-[#ff9900]/60 text-base font-medium">
        Packliste wird geladen...
      </div>
    );
  }

  return (
    <div className="py-6 px-2 flex flex-col items-center min-h-[40vh]">
      {/* Header mit Progress */}
      <div className="w-full max-w-3xl mb-6">
        <h3 className="text-xl font-bold mb-4 text-[#ff9900] tracking-wide text-center drop-shadow">Packliste</h3>
        
        <div className="bg-[#460b6c]/50 backdrop-blur-sm border border-[#ff9900]/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#ff9900]/20 rounded-full">
              <Package className="h-5 w-5 text-[#ff9900]" />
            </div>
            <div>
              <p className="text-[#ff9900] font-medium">
                {checkedCount} von {totalCount} Items erledigt
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-[#ff9900]/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#ff9900] to-[#ffb347] transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {progressPercent < 100 && (
              <div className="absolute right-0 -top-1 text-xs text-[#ff9900]/80">
                {Math.round(progressPercent)}%
              </div>
            )}
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-[#460b6c]/50 backdrop-blur-sm border border-[#ff9900]/20 rounded-lg p-4 mb-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-[#460b6c]/50 backdrop-blur-sm border border-[#ff9900]/30 focus:border-[#ff9900] rounded-lg px-4 py-3 text-[#ff9900] placeholder:text-[#ff9900]/50 transition-colors outline-none"
              placeholder="Dein Item hinzufügen..."
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={!input.trim()}
              className="bg-gradient-to-r from-[#ff9900] to-[#ffb347] text-white rounded-lg px-4 py-3 flex items-center gap-2 font-medium hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Hinzufügen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="w-full max-w-3xl flex flex-col gap-3">
        {activeItems.length === 0 ? (
          <div className="py-12 text-center text-[#ff9900]/60 text-base font-medium">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Noch keine Items</p>
            <p className="text-sm">Füge dein erstes Item zur Packliste hinzu!</p>
          </div>
        ) : (
          activeItems.map(item => (
            <div
              key={item.id}
              className={`bg-[#460b6c]/50 backdrop-blur-sm border border-[#ff9900]/20 rounded-lg p-4 transition-all hover:bg-[#460b6c]/60 ${
                item.checked ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Custom Checkbox */}
                <button
                  onClick={() => handleCheck(item.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                    item.checked
                      ? 'bg-[#ff9900] border-[#ff9900] text-white'
                      : 'border-[#ff9900]/50 hover:border-[#ff9900]'
                  }`}
                >
                  {item.checked && <Check className="h-3 w-3" />}
                </button>
                
                {/* Item Text */}
                <span
                  className={`flex-1 transition-all ${
                    item.checked
                      ? 'line-through text-[#ff9900]/50'
                      : 'text-[#ff9900]'
                  }`}
                >
                  {item.text}
                </span>

                {/* Item Badge */}
                {item.id.startsWith('user_') ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                    Für dich
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-[#ff9900]/20 text-[#ff9900] text-xs rounded-full font-medium">
                    Für alle
                  </span>
                )}

                {/* Delete Button - nur für User-Items */}
                {item.id.startsWith('user_') && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-shrink-0 p-2 text-[#ff9900]/50 hover:text-[#ff9900] hover:bg-[#ff9900]/10 rounded-lg transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 