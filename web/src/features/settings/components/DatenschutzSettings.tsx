import { useState } from 'react';
import UserSettingsCard from './UserSettingsCard';
import { Shield } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import Link from 'next/link';

const DatenschutzContent = () => (
  <div className="max-w-lg mx-auto text-[#460b6c] mb-8">
    <h2 className="text-2xl font-bold mb-4">Datenschutzerklärung</h2>
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Datenschutz auf einen Blick</h3>
        <p>
          Diese Website verarbeitet personenbezogene Daten ausschließlich für die 
          Festival-Anmeldung und technische Funktionalität. Alle Daten werden 
          vertraulich behandelt und nicht an Dritte weitergegeben.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Festival-Anmeldung</h3>
        <p className="mb-2">
          Bei der Anmeldung speichern wir: Name, E-Mail-Adresse, Anmeldedatum 
          und weitere freiwillige Angaben für die Festival-Organisation.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Technische Daten</h3>
        <p className="mb-2">
          <strong>Device-ID:</strong> Zufällige Kennung zur lokalen Speicherung 
          Ihrer Einstellungen. Diese ID ist nicht mit Ihrer Person verknüpfbar.
        </p>
        <p>
          <strong>Lokale Einstellungen:</strong> App-Einstellungen werden lokal in Ihrem Browser gespeichert.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Ihre Rechte</h3>
        <p>
          Sie haben Recht auf Auskunft, Berichtigung, Löschung und weitere 
          DSGVO-Rechte bezüglich Ihrer gespeicherten Daten.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Hosting</h3>
        <p>
          Server in Deutschland (netcup GmbH), DSGVO-konform. 
          <a href="https://www.netcup.de/kontakt/datenschutzerklaerung.php" className="text-[#ff9900] underline hover:text-[#460b6c]" target="_blank" rel="noopener noreferrer">Weitere Infos</a>
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Kontakt</h3>
        <p>
          Bei Fragen zum Datenschutz:
        </p>
        <p className="mt-2 font-mono">huegelfest@hey.fansel.dev</p>
      </div>
      <div className="mt-6 p-4 bg-[#ff9900]/10 rounded-lg border border-[#ff9900]/20">
        <p className="text-sm text-[#460b6c]/80">
          📖 Vollständige Datenschutzerklärung auf der{' '}
          <Link href="/datenschutz" className="text-[#ff9900] underline hover:text-[#460b6c]">
            Datenschutz-Seite
          </Link>
        </p>
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