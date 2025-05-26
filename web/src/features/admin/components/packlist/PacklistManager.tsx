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
      <div className="py-12 text-center text-[#ff9900]/60 text-base font-medium">
        Globale Packliste wird geladen...
      </div>
    );
  }

  return (
    <div className="py-6 px-2 flex flex-col items-center min-h-[40vh]">
      {/* Header */}
      <div className="w-full max-w-3xl mb-6">
        <h3 className="text-xl font-bold mb-4 text-[#ff9900] tracking-wide text-center drop-shadow">
          Globale Packliste verwalten
        </h3>
        
        <div className="bg-[#460b6c]/50 backdrop-blur-sm border border-[#ff9900]/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#ff9900]/20 rounded-full">
              <Users className="h-5 w-5 text-[#ff9900]" />
            </div>
            <div>
              <p className="text-[#ff9900] font-medium">
                {items.length} Items für alle Nutzer
              </p>
              <p className="text-[#ff9900]/70 text-sm">
                Diese Items sehen alle Nutzer in ihrer Packliste
              </p>
            </div>
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
              placeholder="Neues globales Item hinzufügen..."
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              disabled={isPending}
            />
            <button
              onClick={handleAdd}
              disabled={!input.trim() || isPending}
              className="bg-gradient-to-r from-[#ff9900] to-[#ffb347] text-white rounded-lg px-4 py-3 flex items-center gap-2 font-medium hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Hinzufügen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="w-full max-w-3xl flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="py-12 text-center text-[#ff9900]/60 text-base font-medium">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Noch keine globalen Items</p>
            <p className="text-sm">Füge das erste Item zur globalen Packliste hinzu!</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-[#460b6c]/50 backdrop-blur-sm border border-[#ff9900]/20 rounded-lg p-4 transition-all hover:bg-[#460b6c]/60"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="p-2 bg-[#ff9900]/20 rounded-full">
                  <Package className="h-4 w-4 text-[#ff9900]" />
                </div>
                
                {/* Item Text */}
                <span className="flex-1 text-[#ff9900] font-medium">
                  {item.text}
                </span>

                {/* Badge */}
                <span className="px-2 py-1 bg-[#ff9900]/20 text-[#ff9900] text-xs rounded-full font-medium">
                  Für alle
                </span>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(idx)}
                  disabled={isPending}
                  className="flex-shrink-0 p-2 text-[#ff9900]/50 hover:text-[#ff9900] hover:bg-[#ff9900]/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
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