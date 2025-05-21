import React from 'react';
import { useGlobalState } from '@/contexts/GlobalStateContext';
import { useAuth } from '@/features/auth/AuthContext';

/**
 * Toggle für die Festival-Anmeldephase (nur für Admins sichtbar).
 * Wird im Admin-Bereich unter Einstellungen eingebunden.
 */
const FestivalSignupPhaseToggle: React.FC = () => {
  const { signupOpen, setSignupOpen } = useGlobalState();
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={signupOpen}
        onChange={() => setSignupOpen(!signupOpen)}
      />
      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff9900] hover:bg-gray-300"></div>
    </label>
  );
};

export default FestivalSignupPhaseToggle; 