import React, { useState } from 'react';
import FestivalSignupPhaseToggle from './FestivalSignupPhaseToggle';
import PacklistSheet from './PacklistSheet';

const Settings: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-bold text-[#ff9900] mb-4">Admin-Einstellungen</h2>
      <FestivalSignupPhaseToggle />
      {/* Button zum Öffnen des Packlisten-Sheets */}
      <button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-[#ff9900] to-[#ffb347] text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 hover:from-[#ff9900]/90 hover:to-[#ffb347]/90 transition-all"
      >
        Packliste verwalten
      </button>
      {/* Ausgelagertes Sheet für Packlistenverwaltung */}
      <PacklistSheet open={open} setOpen={setOpen} />
    </div>
  );
};

export default Settings; 