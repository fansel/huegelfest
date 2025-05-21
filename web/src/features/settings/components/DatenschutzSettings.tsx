import { useState } from 'react';
import UserSettingsCard from './UserSettingsCard';
import { Shield } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';

const DatenschutzContent = () => (
  <div className="max-w-lg mx-auto text-[#460b6c] mb-8">
    <h2 className="text-2xl font-bold mb-4">Datenschutzerklärung</h2>
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Datenschutz auf einen Blick</h3>
        <p>
          Diese Website verwendet Cookies für die Authentifizierung im Admin-Bereich. Diese Cookies werden nur verwendet, um festzustellen, ob Sie als Administrator eingeloggt sind. Es werden keine personenbezogenen Daten gesammelt oder an Dritte weitergegeben.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Hosting</h3>
        <p>
          Diese Website wird auf Servern der netcup GmbH in Nürnberg, Deutschland gehostet. netcup ist ein deutscher Anbieter von Hosting-Diensten. Die Server befinden sich in Deutschland und unterliegen damit der strengen europäischen Datenschutz-Grundverordnung (DSGVO). Weitere Informationen zum Datenschutz bei netcup finden Sie unter: <a href="https://www.netcup.de/kontakt/datenschutzerklaerung.php" className="text-[#ff9900] underline hover:text-[#460b6c]" target="_blank" rel="noopener noreferrer">netcup Datenschutzerklärung</a>
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">SoundCloud Integration</h3>
        <p>
          Auf dieser Website wird der SoundCloud Player eingebunden. SoundCloud ist ein Dienst der SoundCloud Limited, Rheinsberger Str. 76/77, 10115 Berlin, Deutschland. Wenn Sie eine Seite mit eingebettetem SoundCloud Player besuchen, wird eine Verbindung zu den Servern von SoundCloud hergestellt. SoundCloud kann dadurch Informationen über Ihren Besuch auf dieser Website erhalten. Weitere Informationen zum Datenschutz bei SoundCloud finden Sie unter: <a href="https://soundcloud.com/pages/privacy" className="text-[#ff9900] underline hover:text-[#460b6c]" target="_blank" rel="noopener noreferrer">SoundCloud Datenschutzerklärung</a>
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Kontakt</h3>
        <p>
          Bei Fragen zum Datenschutz können Sie uns unter folgender E-Mail-Adresse kontaktieren:
        </p>
        <p className="mt-2 font-mono">huegelfest@hey.fansel.dev</p>
      </div>
    </div>
  </div>
);

interface DatenschutzSettingsProps {
  variant?: 'row' | 'tile';
}

export default function DatenschutzSettings({ variant = 'row' }: DatenschutzSettingsProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <UserSettingsCard
        icon={<Shield className="w-5 h-5 text-[#ff9900]" />}
        title="Datenschutzerklärung"
        switchElement={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-3 py-1 rounded-full border border-[#ff9900]/60 text-[#ff9900] bg-transparent hover:bg-[#ff9900]/10 focus:outline-none focus:ring-2 focus:ring-[#ff9900]/40 transition"
          >
            Ansehen
          </button>
        }
        variant={variant}
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="max-w-2xl mx-auto max-h-[99vh] overflow-y-auto p-6 rounded-l-2xl">
          <SheetHeader>
            <SheetTitle className="text-[#460b6c]">Datenschutzerklärung</SheetTitle>
          </SheetHeader>
          <DatenschutzContent />
        </SheetContent>
      </Sheet>
    </>
  );
} 