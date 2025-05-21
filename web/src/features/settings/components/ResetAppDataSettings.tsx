import React, { useState } from 'react';
import UserSettingsCard from './UserSettingsCard';
import { Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface ResetAppDataSettingsProps {
  variant?: 'row' | 'tile';
}

const ResetAppDataSettings: React.FC<ResetAppDataSettingsProps> = ({ variant = 'row' }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(c => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
    });
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
    }
    window.location.reload();
  };

  return (
    <UserSettingsCard
      icon={<Trash2 className="w-5 h-5 text-red-600" />}
      title="Alle App-Daten zurücksetzen"
      switchElement={
        <Button
          variant="destructive"
          className="flex items-center gap-2 text-base py-2 px-4 rounded-xl border-2 border-red-400"
          onClick={() => setShowConfirm(true)}
        >
          <Trash2 className="w-5 h-5" />
          Zurücksetzen
        </Button>
      }
      variant={variant}
    >
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-4 max-w-xs w-full">
            <div className="text-lg font-bold text-red-600 text-center">Wirklich alle App-Daten löschen?</div>
            <div className="text-sm text-gray-700 text-center">Das entfernt alle gespeicherten Einstellungen, Anmeldungen und Offline-Daten auf diesem Gerät.</div>
            <div className="flex gap-3 w-full mt-2">
              <Button className="flex-1" variant="secondary" onClick={() => setShowConfirm(false)}>Abbrechen</Button>
              <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={handleReset}>Ja, löschen</Button>
            </div>
          </div>
        </div>
      )}
    </UserSettingsCard>
  );
};

export default ResetAppDataSettings; 