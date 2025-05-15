'use client';
import React, { useEffect, useState } from 'react';
import { getGlobalPacklistAction } from './actions/getGlobalPacklistAction';
import type { PacklistItem } from './types/PacklistItem';

const LOCAL_STORAGE_KEY = 'userPacklist';

interface PacklistProps {
  initialItems?: PacklistItem[];
  isAdmin?: boolean;
}

const Packlist: React.FC<PacklistProps> = ({ initialItems, isAdmin = false }) => {
  const [items, setItems] = useState<PacklistItem[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Merge-Logik: Vereint globale und lokale Packliste.
   * - Neue globale Items werden hinzugefügt
   * - User-Items bleiben erhalten
   * - Gelöschte globale Items werden lokal als deleted markiert
   * - Check-Status bleibt erhalten
   */
  const mergePacklists = (
    global: PacklistItem[],
    local: PacklistItem[]
  ): PacklistItem[] => {
    // 1. Alle globalen Items in ein Map für schnellen Zugriff
    const localMap = new Map(local.map(item => [item.id, item]));
    const merged: PacklistItem[] = [];
    const globalIds = new Set(global.map(item => item.id));

    // 2. Füge alle globalen Items hinzu (mit lokalem Status, falls vorhanden)
    for (const g of global) {
      const localItem = localMap.get(g.id);
      if (localItem) {
        merged.push({ ...g, checked: localItem.checked, deleted: localItem.deleted });
        localMap.delete(g.id);
      } else {
        merged.push({ ...g, checked: false });
      }
    }
    // 3. Füge alle User-Items hinzu, die nicht in global existieren
    for (const item of localMap.values()) {
      // User-Items: id ist KEINE reine Zahl (Timestamp-String)
      if (!item.id.match(/^\d+$/)) {
        merged.push(item);
      }
      // Globale Items, die nicht mehr existieren, werden entfernt (nicht übernommen)
    }
    return merged;
  };

  // Lade aus LocalStorage und merge mit globaler Liste
  useEffect(() => {
    let cancelled = false;
    const loadAndMerge = async () => {
      const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      let local: PacklistItem[] = [];
      if (localRaw) {
        try {
          local = JSON.parse(localRaw);
        } catch (e) {
          local = [];
        }
      }
      const global = await getGlobalPacklistAction();
      if (cancelled) return;
      const merged = mergePacklists(global, local);
      setItems(merged);
      setLoading(false);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
    };
    loadAndMerge();
    return () => { cancelled = true; };
  }, []);

  // Speichere Änderungen immer in LocalStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loading]);

  const handleAdd = () => {
    if (input.trim().length === 0) return;
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), text: input.trim(), checked: false },
    ]);
    setInput('');
  };

  const handleCheck = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? (id.match(/^\d+$/)
            ? { ...item, deleted: true } // globale Items (id ist Zahl)
            : null // User-Items (id ist Timestamp-String)
          )
        : item
    ).filter(Boolean) as PacklistItem[]);
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      {/* Moderner Spinner */}
      <svg className="animate-spin h-14 w-14 text-[#ff9900]" viewBox="0 0 24 24">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-[#f8f4ff] to-[#fff] rounded-xl shadow-xl p-6 border border-[#e9d8fd] opacity-90 mt-10">
      <h2 className="text-2xl font-bold mb-6 text-[#460b6c] flex items-center gap-2">
        <span className="inline-block bg-[#ff9900]/10 text-[#ff9900] px-2 py-1 rounded-full text-base font-semibold">🧳</span>
        Packliste{isAdmin ? ' (Admin)' : ''}
      </h2>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 border-2 border-[#e9d8fd] focus:border-[#ff9900] rounded-lg px-3 py-2 shadow-sm transition-all outline-none bg-white/80 text-[#460b6c] placeholder:text-[#b39ddb]"
          placeholder="Neues Item..."
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="bg-gradient-to-r from-[#ff9900] to-[#ffb347] text-white rounded-full w-11 h-11 flex items-center justify-center text-2xl font-bold shadow hover:scale-110 hover:from-[#ff9900]/90 hover:to-[#ffb347]/90 transition-all focus:outline-none focus:ring-2 focus:ring-[#ff9900]/40 opacity-80"
          aria-label="Hinzufügen"
        >
          +
        </button>
      </div>
      <ul className="space-y-4">
        {items.filter(item => !item.deleted).map(item => (
          <li
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-xl shadow-md bg-white/90 border border-[#e9d8fd] transition-all group hover:shadow-lg ${item.checked ? 'opacity-60 bg-[#f3e8ff]' : ''}`}
          >
            {/* Custom Checkbox */}
            <label className="relative cursor-pointer flex items-center">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleCheck(item.id)}
                className="peer appearance-none w-5 h-5 border-2 border-[#ff9900] rounded-md checked:bg-[#ff9900] checked:border-[#ff9900] transition-all focus:ring-2 focus:ring-[#ff9900]/40 disabled:opacity-50"
                disabled={isAdmin}
              />
              <span className="absolute left-0 top-0 w-5 h-5 flex items-center justify-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </label>
            <span
              className={`flex-1 text-lg transition-colors ${item.checked ? 'line-through text-[#b39ddb]' : 'text-[#460b6c] group-hover:text-[#ff9900]'}`}
            >
              {item.text}
            </span>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-[#ff4d4f] hover:text-white hover:bg-[#ff4d4f] rounded-full p-1 w-8 h-8 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/40"
              aria-label="Löschen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Packlist; 