import React from 'react';
import FestivalSignupPhaseToggle from './FestivalSignupPhaseToggle';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-bold text-[#ff9900] mb-4">Admin-Einstellungen</h2>
      <FestivalSignupPhaseToggle />
      {/* Hier können weitere Settings-Komponenten ergänzt werden */}
    </div>
  );
};

export default Settings; 