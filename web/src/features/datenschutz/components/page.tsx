import Link from 'next/link';

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-[#460b6c] p-8">
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-8 text-white">
        <h1 className="text-3xl font-display mb-8">Datenschutzerklärung</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-display mb-2">Datenschutz auf einen Blick</h2>
            <p className="text-white/80">
              Diese Website verwendet Cookies für die Authentifizierung im Admin-Bereich. Diese Cookies werden nur verwendet, um festzustellen, ob Sie als Administrator eingeloggt sind. Es werden keine personenbezogenen Daten gesammelt oder an Dritte weitergegeben.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Hosting</h2>
            <p className="text-white/80">
              Diese Website wird auf Servern der netcup GmbH in Nürnberg, Deutschland gehostet. netcup ist ein deutscher Anbieter von Hosting-Diensten. Die Server befinden sich in Deutschland und unterliegen damit der strengen europäischen Datenschutz-Grundverordnung (DSGVO). Weitere Informationen zum Datenschutz bei netcup finden Sie unter: <a href="https://www.netcup.de/kontakt/datenschutzerklaerung.php" className="text-white hover:text-white/80 underline" target="_blank" rel="noopener noreferrer">netcup Datenschutzerklärung</a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">SoundCloud Integration</h2>
            <p className="text-white/80">
              Auf dieser Website wird der SoundCloud Player eingebunden. SoundCloud ist ein Dienst der SoundCloud Limited, Rheinsberger Str. 76/77, 10115 Berlin, Deutschland. Wenn Sie eine Seite mit eingebettetem SoundCloud Player besuchen, wird eine Verbindung zu den Servern von SoundCloud hergestellt. SoundCloud kann dadurch Informationen über Ihren Besuch auf dieser Website erhalten. Weitere Informationen zum Datenschutz bei SoundCloud finden Sie unter: <a href="https://soundcloud.com/pages/privacy" className="text-white hover:text-white/80 underline" target="_blank" rel="noopener noreferrer">SoundCloud Datenschutzerklärung</a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Kontakt</h2>
            <p className="text-white/80">
              Bei Fragen zum Datenschutz können Sie uns unter folgender E-Mail-Adresse kontaktieren:
            </p>
            <p className="mt-2">huegelfest@hey.fansel.dev</p>
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