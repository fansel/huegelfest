import Link from 'next/link';

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#460b6c] via-[#5a1a7a] to-[#6d2888] p-8">
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-8 text-white">
        <h1 className="text-3xl font-display mb-8">Datenschutzerklärung</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-display mb-2">Datenschutz auf einen Blick</h2>
            <p className="text-white/80">
              Diese Website verarbeitet personenbezogene Daten ausschließlich für die 
              Festival-Anmeldung und technische Funktionalität. Alle Daten werden 
              vertraulich behandelt und nicht an Dritte weitergegeben.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Welche Daten werden gespeichert?</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#ff9900] mb-2">Festival-Anmeldung</h3>
                <p className="text-white/80 mb-2">
                  Bei der Anmeldung für das Hügelfest speichern wir folgende Daten:
                </p>
                <ul className="list-disc list-inside text-white/80 space-y-1 ml-4">
                  <li>Name</li>
                  <li>E-Mail-Adresse</li>
                  <li>Anmeldedatum</li>
                  <li>Weitere freiwillige Angaben (falls gemacht)</li>
                </ul>
                <p className="text-white/80 mt-2">
                  <strong>Zweck:</strong> Organisation des Festivals, Kommunikation mit Teilnehmenden
                </p>
                <p className="text-white/80">
                  <strong>Rechtsgrundlage:</strong> Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#ff9900] mb-2">Technische Daten</h3>
                <p className="text-white/80 mb-2">
                  <strong>Device-ID:</strong> Eine zufällig generierte Kennung zur lokalen 
                  Speicherung Ihrer Einstellungen und Präferenzen. Diese ID ist 
                  nicht mit Ihrer Person verknüpfbar.
                </p>
                <p className="text-white/80">
                  <strong>Lokale Einstellungen:</strong> Ihre individuellen App-Einstellungen 
                  (z.B. Design-Präferenzen) werden lokal in Ihrem Browser gespeichert.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Wie lange speichern wir Ihre Daten?</h2>
            <p className="text-white/80">
              Anmeldedaten werden nur so lange gespeichert, wie es für die Organisation 
              des Festivals erforderlich ist. Nach dem Festival werden die Daten 
              gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Hosting</h2>
            <p className="text-white/80">
              Diese Website wird auf Servern der netcup GmbH in Nürnberg, Deutschland gehostet. 
              netcup ist ein deutscher Anbieter von Hosting-Diensten. Die Server befinden sich 
              in Deutschland und unterliegen damit der strengen europäischen Datenschutz-Grundverordnung (DSGVO). 
              Weitere Informationen zum Datenschutz bei netcup finden Sie unter: 
              <a href="https://www.netcup.de/kontakt/datenschutzerklaerung.php" 
                 className="text-[#ff9900] hover:text-[#ffb340] underline ml-1" 
                 target="_blank" 
                 rel="noopener noreferrer">
                netcup Datenschutzerklärung
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Ihre Rechte</h2>
            <p className="text-white/80 mb-4">
              Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-1 ml-4">
              <li>Auskunft über gespeicherte Daten</li>
              <li>Berichtigung unrichtiger Daten</li>
              <li>Löschung Ihrer Daten</li>
              <li>Einschränkung der Verarbeitung</li>
              <li>Datenübertragbarkeit</li>
              <li>Widerspruch gegen die Verarbeitung</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Kontakt</h2>
            <p className="text-white/80">
              Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte können Sie mich 
              unter folgender E-Mail-Adresse kontaktieren:
            </p>
            <p className="mt-2 text-[#ff9900]">huegelfest@hey.fansel.dev</p>
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