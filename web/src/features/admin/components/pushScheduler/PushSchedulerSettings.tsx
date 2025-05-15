import React, { useState, useEffect, useTransition } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import FunPushPoolForm from './FunPushPoolForm';
import ScheduledPushForm from './ScheduledPushForm';
import PushSchedulerList from './PushSchedulerList';
import { FunPushPoolConfig, ScheduledPushMessage } from './pushSchedulerTypes';
import { Bell, CalendarClock, Plus } from 'lucide-react';
import FullScreenSheet from './FullScreenSheet';
import {
  actionGetFunPushPools,
  actionSaveFunPushPool,
  actionDeleteFunPushPool,
} from './actions/funPushPoolActions';
import {
  actionGetScheduledPushMessages,
  actionSaveScheduledPushMessage,
  actionDeleteScheduledPushMessage,
} from './actions/scheduledPushActions';

// Platzhalter für die späteren Komponenten
const FunPushPoolTab: React.FC = () => <div>Fun Pool Verwaltung (coming soon)</div>;
const ScheduledPushTab: React.FC = () => <div>Geplante Einzel-Nachrichten (coming soon)</div>;

interface PushSchedulerSettingsProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PushSchedulerSettings: React.FC<PushSchedulerSettingsProps> = ({ open, setOpen }) => {
  const [tab, setTab] = useState<'pool' | 'single'>('pool');
  const [pools, setPools] = useState<FunPushPoolConfig[]>([]);
  const [singles, setSingles] = useState<ScheduledPushMessage[]>([]);
  const [editingPool, setEditingPool] = useState<FunPushPoolConfig | null>(null);
  const [showPoolForm, setShowPoolForm] = useState(false);
  const [editingSingle, setEditingSingle] = useState<ScheduledPushMessage | null>(null);
  const [showSingleForm, setShowSingleForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Initiales Laden
  useEffect(() => {
    startTransition(() => {
      actionGetFunPushPools().then(setPools);
      actionGetScheduledPushMessages().then(setSingles);
    });
  }, []);

  // Pool-Handler
  const handleAddPool = () => { setEditingPool(null); setShowPoolForm(true); };
  const handleEditPool = (pool: FunPushPoolConfig) => { setEditingPool(pool); setShowPoolForm(true); };
  const handleDeletePool = (id: string) => {
    startTransition(async () => {
      await actionDeleteFunPushPool(id);
      setPools(await actionGetFunPushPools());
    });
  };
  const handleSavePool = (pool: FunPushPoolConfig) => {
    startTransition(async () => {
      await actionSaveFunPushPool(pool);
      setPools(await actionGetFunPushPools());
      setShowPoolForm(false);
    });
  };

  // Einzel-Handler
  const handleAddSingle = () => { setEditingSingle(null); setShowSingleForm(true); };
  const handleEditSingle = (msg: ScheduledPushMessage) => { setEditingSingle(msg); setShowSingleForm(true); };
  const handleDeleteSingle = (id: string) => {
    startTransition(async () => {
      await actionDeleteScheduledPushMessage(id);
      setSingles(await actionGetScheduledPushMessages());
    });
  };
  const handleSaveSingle = (msg: ScheduledPushMessage) => {
    startTransition(async () => {
      await actionSaveScheduledPushMessage(msg);
      setSingles(await actionGetScheduledPushMessages());
      setShowSingleForm(false);
    });
  };

  // FAB-Handler
  const handleFabClick = () => {
    if (tab === 'pool') handleAddPool();
    else handleAddSingle();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full max-w-full h-full p-0 sm:p-0 overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle>Fun Local Push & Scheduler</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full w-full">
          <div className="max-w-3xl mx-auto w-full px-2 sm:px-8 pt-8 pb-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#460b6c] tracking-tight flex items-center gap-3">
                {tab === 'pool' ? <Bell className="w-8 h-8 text-[#ff9900]" /> : <CalendarClock className="w-8 h-8 text-[#ff9900]" />}
                Fun Local Push & Scheduler
              </h2>
            </div>
            <Tabs value={tab} onValueChange={v => setTab(v as 'pool' | 'single')} className="w-full">
              <TabsList className="flex justify-center gap-2 mb-6">
                <TabsTrigger value="pool">Pool-Nachrichten</TabsTrigger>
                <TabsTrigger value="single">Einzel-Nachrichten</TabsTrigger>
              </TabsList>
              <TabsContent value="pool">
                <div className="bg-white rounded-xl shadow p-4">
                  <PushSchedulerList
                    pools={pools}
                    onEditPool={handleEditPool}
                    onDeletePool={handleDeletePool}
                  />
                </div>
              </TabsContent>
              <TabsContent value="single">
                <div className="bg-white rounded-xl shadow p-4">
                  <PushSchedulerList
                    singles={singles}
                    onEditSingle={handleEditSingle}
                    onDeleteSingle={handleDeleteSingle}
                  />
                </div>
              </TabsContent>
            </Tabs>
            {/* Floating Action Button */}
            <button
              onClick={handleFabClick}
              className="fixed bottom-8 right-8 z-50 rounded-full bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl w-16 h-16 flex items-center justify-center text-3xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition border-2 border-white"
              aria-label={tab === 'pool' ? 'Neuen Pool anlegen' : 'Neue Einzel-Nachricht anlegen'}
              type="button"
            >
              <Plus className="h-8 w-8" />
            </button>
            {/* Pool-Formular als Dialog */}
            <FullScreenSheet
              open={showPoolForm}
              onClose={() => setShowPoolForm(false)}
              title={editingPool ? 'Fun Push Pool bearbeiten' : 'Fun Push Pool anlegen'}
            >
              <FunPushPoolForm
                initial={editingPool || undefined}
                onSave={handleSavePool}
                onCancel={() => setShowPoolForm(false)}
              />
            </FullScreenSheet>
            {/* Einzel-Formular als Dialog */}
            <FullScreenSheet
              open={showSingleForm}
              onClose={() => setShowSingleForm(false)}
              title={editingSingle ? 'Einzel-Nachricht bearbeiten' : 'Einzel-Nachricht anlegen'}
            >
              <ScheduledPushForm
                initial={editingSingle || undefined}
                onSave={handleSaveSingle}
                onCancel={() => setShowSingleForm(false)}
              />
            </FullScreenSheet>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PushSchedulerSettings; 