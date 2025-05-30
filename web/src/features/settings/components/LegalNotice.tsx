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
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
        </p>
        <p className="mt-2">
          Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Haftung für Links</h3>
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Urheberrecht</h3>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
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
