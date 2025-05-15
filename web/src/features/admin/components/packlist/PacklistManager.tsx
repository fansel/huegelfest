"use client";
import { useState, useEffect, useTransition } from 'react';
import { addPacklistItemAction } from '@/features/packlist/actions/addPacklistItemAction';
import { removePacklistItemAction } from '@/features/packlist/actions/removePacklistItemAction';
import { getGlobalPacklistAction } from '@/features/packlist/actions/getGlobalPacklistAction';
import type { PacklistItem } from '@/features/packlist/types/PacklistItem';

const PacklistManager: React.FC = () => {
  const [items, setItems] = useState<PacklistItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadPacklist = async () => {
    setLoading(true);
    const data = await getGlobalPacklistAction();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPacklist();
  }, []);

  const handleAdd = async () => {
    if (input.trim().length === 0) return;
    startTransition(async () => {
      await addPacklistItemAction(input.trim());
      setInput('');
      await loadPacklist();
    });
  };

  const handleDelete = async (index: number) => {
    startTransition(async () => {
      await removePacklistItemAction(index);
      await loadPacklist();
    });
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      <svg className="animate-spin h-14 w-14 text-[#ff9900]" viewBox="0 0 24 24">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-[#f8f4ff] to-[#fff] rounded-xl shadow-xl p-6 border border-[#e9d8fd] opacity-90">
      <h2 className="text-2xl font-bold mb-6 text-[#460b6c] flex items-center gap-2">
        <span className="inline-block bg-[#ff9900]/10 text-[#ff9900] px-2 py-1 rounded-full text-base font-semibold">🧳</span>
        Globale Packliste verwalten (Admin)
      </h2>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 border-2 border-[#e9d8fd] focus:border-[#ff9900] rounded-lg px-3 py-2 shadow-sm transition-all outline-none bg-white/80 text-[#460b6c] placeholder:text-[#b39ddb]"
          placeholder="Neues Item..."
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          disabled={isPending}
        />
        <button
          onClick={handleAdd}
          className="bg-gradient-to-r from-[#ff9900] to-[#ffb347] text-white rounded-full w-11 h-11 flex items-center justify-center text-2xl font-bold shadow hover:scale-110 hover:from-[#ff9900]/90 hover:to-[#ffb347]/90 transition-all focus:outline-none focus:ring-2 focus:ring-[#ff9900]/40 opacity-80"
          aria-label="Hinzufügen"
          disabled={isPending}
        >
          +
        </button>
      </div>
      <ul className="space-y-4">
        {items.map((item, idx) => (
          <li
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-xl shadow-md bg-white/90 border border-[#e9d8fd] transition-all group hover:shadow-lg"
          >
            <span className="flex-1 text-lg text-[#460b6c] group-hover:text-[#ff9900] transition-colors">{item.text}</span>
            <button
              onClick={() => handleDelete(idx)}
              className="text-[#ff4d4f] hover:text-white hover:bg-[#ff4d4f] rounded-full p-1 w-8 h-8 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/40"
              aria-label="Löschen"
              disabled={isPending}
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

export default PacklistManager;