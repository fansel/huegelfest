import React, { useEffect, useState } from 'react';
import FestivalRegisterForm, { FestivalRegisterData } from '../registration/FestivalRegisterForm';
import Cookies from 'js-cookie';

const COOKIE_KEY = 'festivalRegistration';

/**
 * Komponente für die Festival-Anmeldephase.
 * Wird angezeigt, wenn die Anmeldephase aktiv ist und der "Anmeldung"-Tab ausgewählt ist.
 */
export interface SignupPhaseInfoProps {
  // Optional: Später für weitere Props (z.B. für ein Anmeldeformular)
}

const SignupPhaseInfo: React.FC = () => {
  const [registered, setRegistered] = useState<FestivalRegisterData | null>(null);

  useEffect(() => {
    const cookie = Cookies.get(COOKIE_KEY);
    if (cookie) {
      try {
        setRegistered(JSON.parse(cookie));
      } catch {
        setRegistered(null);
      }
    }
  }, []);

  const handleRegister = (data: FestivalRegisterData) => {
    Cookies.set(COOKIE_KEY, JSON.stringify(data), { expires: 30 });
    setRegistered(data);
  };

  if (registered) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="text-2xl font-bold text-[#ff9900] mb-4">Du bist angemeldet!</h2>
        <div className="bg-[#460b6c]/10 border border-[#ff9900]/30 rounded-lg p-4 text-[#460b6c] max-w-md mx-auto">
          <div className="mb-2 font-semibold">Name: {registered.name}</div>
          <div className="mb-2">Tage: {registered.days.map(i => ['31.07.','01.08.','02.08.','03.08.'][i]).join(', ')}</div>
          <div className="mb-2">Preisoption: {registered.priceOption === 'full' ? 'Voller Preis' : registered.priceOption === 'reduced' ? 'Reduziert' : 'Kostenlos'}</div>
          <div className="mb-2">Sanitätsausbildung: {registered.isMedic ? 'Ja' : 'Nein'}</div>
          <div className="mb-2">Auto: {registered.hasCar ? 'Ja' : 'Nein'}</div>
          <div className="mb-2">Equipment: {registered.equipment || '—'}</div>
          <div className="mb-2">Anliegen: {registered.concerns || '—'}</div>
          <div className="mb-2">Line-Up: {registered.wantsToContribute ? 'Ja' : 'Nein'}</div>
          <div className="mb-2">Workshop: {registered.wantsToOfferWorkshop || '—'}</div>
          <div className="mb-2">Schlafpräferenz: {registered.sleepingPreference === 'bed' ? 'Bett' : registered.sleepingPreference === 'tent' ? 'Zelt' : 'Auto'}</div>
        </div>
        <div className="mt-4 text-xs text-[#ff9900]/80">Du kannst deine Anmeldung löschen, indem du die Cookies im Browser entfernst.</div>
        <button
          className="mt-4 px-4 py-2 rounded bg-red-100 text-red-700 font-semibold border border-red-200 hover:bg-red-200 transition-colors"
          onClick={() => {
            Cookies.remove(COOKIE_KEY);
            window.location.reload();
          }}
        >
          Debug: Anmeldung zurücksetzen
        </button>
      </div>
    );
  }

  return <FestivalRegisterForm onRegister={handleRegister} />;
};

export default SignupPhaseInfo; 