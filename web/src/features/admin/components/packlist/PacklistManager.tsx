"use client";
import { useState, useEffect, useTransition } from 'react';
import { Package, Plus, Trash2, Loader2, Users } from 'lucide-react';
import { addPacklistItemAction } from '@/features/packlist/actions/addPacklistItemAction';
import { removePacklistItemAction } from '@/features/packlist/actions/removePacklistItemAction';
import { getGlobalPacklistAction } from '@/features/packlist/actions/getGlobalPacklistAction';
import type { PacklistItem } from '@/features/packlist/types/PacklistItem';
import toast from 'react-hot-toast';

const PacklistManager: React.FC = () => {
  const [items, setItems] = useState<PacklistItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadPacklist = async () => {
    try {
      setLoading(true);
      const data = await getGlobalPacklistAction();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fehler beim Laden der Packliste:', error);
      toast.error('Fehler beim Laden der Packliste');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacklist();
  }, []);

  const handleAdd = async () => {
    if (input.trim().length === 0) return;
    startTransition(async () => {
      try {
        await addPacklistItemAction(input.trim());
        setInput('');
        toast.success('Item zur globalen Liste hinzugefügt!');
        await loadPacklist(); // Aktualisiere die Liste
      } catch (error) {
        console.error('Fehler beim Hinzufügen:', error);
        toast.error('Fehler beim Hinzufügen des Items');
      }
    });
  };

  const handleDelete = async (index: number) => {
    if (!window.confirm('Item wirklich aus der globalen Liste entfernen?')) return;
    
    startTransition(async () => {
      try {
        await removePacklistItemAction(index);
        toast.success('Item aus globaler Liste entfernt!');
        await loadPacklist(); // Aktualisiere die Liste
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        toast.error('Fehler beim Löschen des Items');
      }
    });
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-[#ff9900]/60 text-lg font-medium">
        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-[#ff9900]" />
        Globale Packliste wird geladen...
      </div>
    );
  }

  return (
    <div className="py-6 px-2 flex flex-col items-center min-h-[40vh]">
      {/* Header */}
      <div className="w-full max-w-3xl mb-6">
        <div className="bg-[#ff9900]/10 backdrop-blur-sm border border-[#ff9900]/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#ff9900]/20 rounded-full">
              <Users className="h-6 w-6 text-[#ff9900]" />
            </div>
            <div>
              <p className="text-[#ff9900] font-bold text-lg">
                {items.length} Items für alle Nutzer
              </p>
              <p className="text-[#ff9900]/70 text-sm">
                Diese Items sehen alle Nutzer in ihrer Packliste
              </p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-[#ff9900]/5 backdrop-blur-sm border border-[#ff9900]/20 rounded-xl p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-[#ff9900]/10 backdrop-blur-sm border border-[#ff9900]/30 focus:border-[#ff9900] rounded-lg px-4 py-3 text-[#ff9900] placeholder:text-[#ff9900]/50 transition-colors outline-none focus:ring-2 focus:ring-[#ff9900]/20"
              placeholder="Neues globales Item hinzufügen..."
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              disabled={isPending}
            />
            <button
              onClick={handleAdd}
              disabled={!input.trim() || isPending}
              className="bg-gradient-to-r from-[#ff9900] to-[#ffb347] text-white rounded-lg px-6 py-3 flex items-center gap-3 font-semibold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-lg hover:shadow-xl"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">Hinzufügen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="w-full max-w-3xl flex flex-col gap-4">
        {items.length === 0 ? (
          <div className="bg-[#ff9900]/5 border border-[#ff9900]/20 rounded-xl p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-[#ff9900]/40" />
            <p className="text-[#ff9900]/60 text-lg font-semibold mb-2">Noch keine globalen Items</p>
            <p className="text-[#ff9900]/40 text-sm">Füge das erste Item zur globalen Packliste hinzu!</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-[#ff9900]/5 backdrop-blur-sm border border-[#ff9900]/20 rounded-xl p-6 transition-all hover:bg-[#ff9900]/10 hover:shadow-lg group"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="p-3 bg-[#ff9900]/20 rounded-full group-hover:bg-[#ff9900]/30 transition-colors">
                  <Package className="h-5 w-5 text-[#ff9900]" />
                </div>
                
                {/* Item Text */}
                <span className="flex-1 text-[#ff9900] font-semibold text-lg">
                  {item.text}
                </span>

                {/* Badge */}
                <span className="px-3 py-1.5 bg-[#ff9900]/20 text-[#ff9900] text-sm rounded-full font-medium border border-[#ff9900]/30">
                  Für alle
                </span>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(idx)}
                  disabled={isPending}
                  className="flex-shrink-0 p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 group-hover:scale-110"
                >
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PacklistManager;