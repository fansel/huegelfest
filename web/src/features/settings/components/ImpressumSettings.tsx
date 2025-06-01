import { useState } from 'react';
import UserSettingsCard from './UserSettingsCard';
import { FileText } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import Link from 'next/link';

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
      <div className="mt-6 p-4 bg-[#ff9900]/10 rounded-lg border border-[#ff9900]/20">
        <p className="text-sm text-[#460b6c]/80">
          🚀 <strong>Lust auf mehr?</strong> Besuche die{' '}
          <Link href="/impressum" className="text-[#ff9900] underline hover:text-[#460b6c]">
            Developer-Seite
          </Link>{' '}
          und erfahre mehr über diese Website!
        </p>
      </div>
    </div>
  </div>
);

interface ImpressumSettingsProps {
  variant?: 'row' | 'tile';
}

export default function ImpressumSettings({ variant = 'row' }: ImpressumSettingsProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <UserSettingsCard
        icon={<FileText className="w-5 h-5 text-[#ff9900]" />}
        title="Impressum"
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
            <SheetTitle className="text-[#460b6c]">Impressum</SheetTitle>
          </SheetHeader>
          <ImpressumContent />
        </SheetContent>
      </Sheet>
    </>
  );
} 