//Hier kommt eine verlinkung zur datenschutzseite und zum impressum 

import { useState, useRef } from 'react';
import Link from "next/link";
import { FaGavel, FaUserShield, FaChevronDown } from "react-icons/fa";

function Sheet({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDeltaY, setTouchDeltaY] = useState(0);
  const [canSwipeToClose, setCanSwipeToClose] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Prüfe, ob der Content ganz oben ist
    if (contentRef.current && contentRef.current.scrollTop === 0) {
      setCanSwipeToClose(true);
      setTouchStartY(e.touches[0].clientY);
    } else {
      setCanSwipeToClose(false);
      setTouchStartY(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (canSwipeToClose && touchStartY !== null) {
      const deltaY = e.touches[0].clientY - touchStartY;
      setTouchDeltaY(deltaY > 0 ? deltaY : 0);
    }
  };

  const handleTouchEnd = () => {
    if (canSwipeToClose && touchDeltaY > 60) {
      onClose();
    }
    setTouchStartY(null);
    setTouchDeltaY(0);
    setCanSwipeToClose(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div
        className="relative w-full max-w-lg rounded-t-3xl bg-[#f9f9fa] shadow-2xl animate-slideUp max-h-[95vh] flex flex-col"
        style={{
          animation: 'slideUp 0.3s cubic-bezier(.4,0,.2,1)',
          transform: touchDeltaY ? `translateY(${touchDeltaY}px)` : undefined,
          transition: touchDeltaY ? 'none' : 'transform 0.2s',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grabber */}
        <div className="flex justify-center pt-3">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-2" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-2">
          <div className="font-bold text-lg text-[#460b6c] flex-1 text-center">{title}</div>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-2xl text-[#460b6c] hover:text-[#ff9900] focus:outline-none"
            aria-label="Schließen"
          >
            <FaChevronDown />
          </button>
        </div>
        {/* Content */}
        <div ref={contentRef} className="px-6 pb-6 pt-2 overflow-y-auto flex-1">{children}</div>
      </div>
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const DatenschutzContent = () => (
  <div className="max-w-lg mx-auto text-[#460b6c]">
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
  <div className="max-w-lg mx-auto text-[#460b6c]">
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
  const [sheet, setSheet] = useState<'datenschutz' | 'impressum' | null>(null);
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <span className="text-[#ff9900] font-medium">Rechtliches</span>
          <span className="text-[#ff9900]/60 text-sm">
            Wichtige rechtliche Hinweise und Informationen
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setSheet('datenschutz')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white shadow hover:bg-gray-50 transition-colors text-[#460b6c] focus:outline-none focus:ring-2 focus:ring-[#ff9900]"
          >
            <FaUserShield className="text-[#ff9900]" />
            <span>Datenschutz</span>
          </button>
          <button
            type="button"
            onClick={() => setSheet('impressum')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white shadow hover:bg-gray-50 transition-colors text-[#460b6c] focus:outline-none focus:ring-2 focus:ring-[#ff9900]"
          >
            <FaGavel className="text-[#ff9900]" />
            <span>Impressum</span>
          </button>
        </div>
      </div>
      {sheet === 'datenschutz' && (
        <Sheet title="Datenschutz" onClose={() => setSheet(null)}>
          <DatenschutzContent />
        </Sheet>
      )}
      {sheet === 'impressum' && (
        <Sheet title="Impressum" onClose={() => setSheet(null)}>
          <ImpressumContent />
        </Sheet>
      )}
    </div>
  );
}
