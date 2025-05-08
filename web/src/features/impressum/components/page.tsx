import Link from 'next/link';

export default function Impressum() {
  return (
    <div className="min-h-screen bg-[#460b6c] p-8">
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-8 text-white">
        <h1 className="text-3xl font-display mb-8">Impressum</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-display mb-2">Angaben gemäß § 5 TMG</h2>
            <p>Felix Mansel</p>
            <p>Neustädterstraße 19</p>
            <p>04315 Leipzig</p>
            <p>E-Mail: huegelfest@hey.fansel.dev</p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Haftung für Inhalte</h2>
            <p className="text-white/80">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p className="text-white/80 mt-2">
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Haftung für Links</h2>
            <p className="text-white/80">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Urheberrecht</h2>
            <p className="text-white/80">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-white/60 hover:text-white transition-colors">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
} 