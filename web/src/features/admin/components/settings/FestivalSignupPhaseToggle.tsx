import React from 'react';
import { useFestivalSignupPhase } from '@/contexts/FestivalSignupPhaseContext';
import { useAuth } from '@/features/auth/AuthContext';

/**
 * Toggle für die Festival-Anmeldephase (nur für Admins sichtbar).
 * Wird im Admin-Bereich unter Einstellungen eingebunden.
 */
const FestivalSignupPhaseToggle: React.FC = () => {
  const { isSignupPhase, setSignupPhase } = useFestivalSignupPhase();
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#ff9900]/10 p-4 rounded-lg border border-[#ff9900]/20">
      <div className="flex flex-col space-y-1">
        <span className="text-[#ff9900] font-medium">Festival-Anmeldephase</span>
        <span className="text-[#ff9900]/60 text-sm">
          Wenn aktiv, sehen Nutzer nur die Anmeldung. Admins behalten vollen Zugriff.
        </span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={isSignupPhase}
          onChange={() => setSignupPhase(!isSignupPhase)}
        />
        <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff9900] hover:bg-gray-300"></div>
      </label>
    </div>
  );
};

export default FestivalSignupPhaseToggle; 