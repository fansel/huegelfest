import React from 'react';

/**
 * Komponente für die Festival-Anmeldephase.
 * Wird angezeigt, wenn die Anmeldephase aktiv ist und der "Anmeldung"-Tab ausgewählt ist.
 */
export interface SignupPhaseInfoProps {
  // Optional: Später für weitere Props (z.B. für ein Anmeldeformular)
}

const SignupPhaseInfo: React.FC<SignupPhaseInfoProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <h2 className="text-2xl font-bold text-[#ff9900] mb-4">Festival-Anmeldephase</h2>
      <p className="text-[#ff9900]/80 text-lg mb-2">
        Die Anmeldung für das Festival ist bald möglich!<br />
        Aktuell befindet sich die App im Anmelde-Modus.
      </p>
      <div className="mt-6 p-4 bg-[#460b6c]/20 rounded-lg border border-[#ff9900]/30 text-[#ff9900]/80">
        <strong>Debug-Info:</strong> <br />
        Diese Ansicht wird allen Nutzern angezeigt, solange die Anmeldephase aktiv ist.<br />
        (Später erscheint hier das Anmeldeformular.)
      </div>
    </div>
  );
};

export default SignupPhaseInfo; 