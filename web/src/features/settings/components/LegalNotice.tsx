//Hier kommt eine verlinkung zur datenschutzseite und zum impressum 

import { useState } from 'react';
import Link from "next/link";
import { Gavel, Shield, ChevronDown, FileText } from 'lucide-react';
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import UserSettingsCard from './UserSettingsCard';

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
          und weitere freiwillige Angaben.
        </p>
        <p className="text-sm text-[#460b6c]/80">
          <strong>Zweck:</strong> Festival-Organisation und Kommunikation<br/>
          <strong>Rechtsgrundlage:</strong> Vertragserfüllung (DSGVO Art. 6 Abs. 1 lit. b)
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Technische Daten</h3>
        <p className="mb-2">
          <strong>Device-ID:</strong> Zufällige Kennung zur lokalen Speicherung 
          Ihrer Einstellungen (nicht personenbezogen).
        </p>
        <p>
          <strong>Lokale Einstellungen:</strong> App-Einstellungen werden lokal in Ihrem Browser gespeichert.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Ihre Rechte</h3>
        <p>
          Sie haben Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, 
          Datenübertragbarkeit und Widerspruch bezüglich Ihrer Daten.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Hosting</h3>
        <p>
          Server in Deutschland (netcup GmbH), DSGVO-konform. 
          <a href="https://www.netcup.de/kontakt/datenschutzerklaerung.php" className="text-[#ff9900] underline hover:text-[#460b6c] ml-1" target="_blank" rel="noopener noreferrer">Mehr Info</a>
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

const ImpressumContent = () => (
  <div className="max-w-lg mx-auto text-[#460b6c] mb-8">
    <h2 className="text-2xl font-bold mb-4">Impressum</h2>
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Angaben gemäß § 5 TMG</h3>
        <p>Felix Mansel</p>
        <p>Neustädterstraße 19</p>
        <p>04315 Leipzig</p>
        <p>E-Mail: huegelfest@hey.fansel.dev</p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Haftung für Inhalte</h3>
        <p>
          Als Diensteanbieter bin ich gemäß § 7 Abs.1 TMG für eigene Inhalte 
          auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Urheberrecht</h3>
        <p>
          Die durch mich erstellten Inhalte und Werke auf diesen Seiten unterliegen 
          dem deutschen Urheberrecht. Downloads und Kopien dieser Seite sind nur für 
          den privaten, nicht kommerziellen Gebrauch gestattet.
        </p>
      </div>
      <div className="mt-6 p-4 bg-[#ff9900]/10 rounded-lg border border-[#ff9900]/20">
        <p className="text-sm text-[#460b6c]/80">
          💡 <strong>Tipp:</strong> Besuche die{' '}
          <Link href="/impressum" className="text-[#ff9900] underline hover:text-[#460b6c]">
            ausführliche Developer-Seite
          </Link>{' '}
          für mehr Infos über diese Website!
        </p>
      </div>
    </div>
  </div>
);

export default function LegalNotice() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <UserSettingsCard
        icon={<FileText className="w-5 h-5 text-[#ff9900]" />}
        title="Rechtliches"
        switchElement={null}
        info={<span className="cursor-pointer" onClick={() => setOpen(true)}>Impressum & Datenschutzhinweise ansehen</span>}
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="max-w-2xl mx-auto max-h-[99vh] overflow-y-auto p-6 rounded-l-2xl">
          <SheetHeader>
            <SheetTitle className="text-[#460b6c]">Rechtliches</SheetTitle>
          </SheetHeader>
          <DatenschutzContent />
          <ImpressumContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
