import React, { useState } from 'react';
import FestivalSignupPhaseToggle from './FestivalSignupPhaseToggle';
import PacklistSheet from './PacklistSheet';
import PushSchedulerSettings from '../pushScheduler/PushSchedulerSettings';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { ClipboardList, Bell, Settings as SettingsIcon } from 'lucide-react';

/**
 * Admin-Settings: Responsive, modernes Card-Grid für Desktop, einspaltig für Mobile.
 * Jede Card enthält Icon, Titel, Beschreibung und Action-Button.
 */
const Settings: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';

  // Card-Daten für Desktop-Grid
  const cards = [
    {
      icon: <SettingsIcon className="w-8 h-8 text-[#ff9900]" />,
      title: 'Anmeldephase',
      description: 'Steuere, ob die Festival-Anmeldung für Nutzer sichtbar ist.',
      content: <FestivalSignupPhaseToggle />,
      action: null,
    },
    {
      icon: <ClipboardList className="w-8 h-8 text-[#ff9900]" />,
      title: 'Packliste',
      description: 'Verwalte die globale Packliste für alle Teilnehmer.',
      content: null,
      action: (
        <button
          onClick={() => setOpen(true)}
          className="bg-gradient-to-r from-[#ff9900] to-[#ffb347] text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 hover:from-[#ff9900]/90 hover:to-[#ffb347]/90 transition-all"
        >
          Packliste verwalten
        </button>
      ),
    },
    {
      icon: <Bell className="w-8 h-8 text-[#ff9900]" />,
      title: 'Push & Scheduler',
      description: 'Plane und verwalte Fun Push-Nachrichten für das Festival.',
      content: null,
      action: (
        <button
          onClick={() => setPushOpen(true)}
          className="bg-gradient-to-r from-[#ff9900] to-[#ffb347] text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 hover:from-[#ff9900]/90 hover:to-[#ffb347]/90 transition-all"
        >
          Fun Local Push & Scheduler
        </button>
      ),
    },
  ];

  return (
    <div className={isMobile ? 'space-y-6 p-4' : 'flex flex-col items-center w-full min-h-[70vh] py-10'}>
      <h2 className={isMobile ? 'text-xl font-bold text-[#ff9900] mb-4' : 'text-3xl font-extrabold text-[#ff9900] mb-10 tracking-tight'}>
        Admin-Einstellungen
      </h2>
      {isMobile ? (
        <>
          <FestivalSignupPhaseToggle />
          <button
            onClick={() => setOpen(true)}
            className="bg-gradient-to-r from-[#ff9900] to-[#ffb347] text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 hover:from-[#ff9900]/90 hover:to-[#ffb347]/90 transition-all w-full"
          >
            Packliste verwalten
          </button>
          <button
            onClick={() => setPushOpen(true)}
            className="bg-gradient-to-r from-[#ff9900] to-[#ffb347] text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 hover:from-[#ff9900]/90 hover:to-[#ffb347]/90 transition-all w-full"
          >
            Fun Local Push & Scheduler
          </button>
        </>
      ) : (
        <div className="grid grid-cols-3 gap-8 w-full max-w-5xl bg-transparent rounded-3xl p-8 shadow-none">
          {cards.map((card, idx) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl shadow-2xl border-2 border-[#ff9900]/10 p-8 flex flex-col items-center text-center hover:shadow-[#ff9900]/20 transition-shadow min-h-[260px]"
            >
              <div className="mb-4">{card.icon}</div>
              <div className="text-xl font-bold text-[#ff9900] mb-2">{card.title}</div>
              <div className="text-gray-600 text-sm mb-6 min-h-[40px]">{card.description}</div>
              {card.content}
              {card.action}
            </div>
          ))}
        </div>
      )}
      {/* Sheets für Details */}
      <PacklistSheet open={open} setOpen={setOpen} />
      <PushSchedulerSettings open={pushOpen} setOpen={setPushOpen} />
    </div>
  );
};

export default Settings; 