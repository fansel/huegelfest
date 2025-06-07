import Link from 'next/link';

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#460b6c] via-[#5a1a7a] to-[#6d2888] p-8">
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-lg p-8 text-white">
        <h1 className="text-3xl font-display mb-8">Datenschutzerklärung</h1>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-display mb-2">Wichtiger Hinweis</h2>
            <p className="text-white/80 mb-4">
              Diese Website ist eine private Plattform, die ausschließlich für die Organisation 
              und Durchführung des Hügelfests unter Freunden konzipiert ist. Sie ist nicht 
              öffentlich zugänglich und dient nicht kommerziellen Zwecken.
            </p>
            <p className="text-white/80">
              Als private Plattform legen wir besonderen Wert auf den vertrauensvollen Umgang 
              mit den Daten unserer Freunde und Festival-Teilnehmer.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Datenschutz auf einen Blick</h2>
            <p className="text-white/80">
              Diese private Website verarbeitet personenbezogene Daten ausschließlich für die 
              Organisation des Hügelfests, die Authentifizierung der Teilnehmer und die 
              gemeinsame Nutzung von Musik-Features. Die Verarbeitung erfolgt auf unseren 
              Servern in Deutschland und unterliegt der DSGVO.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Welche Daten werden gespeichert?</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#ff9900] mb-2">Authentifizierung & Benutzerkonten</h3>
                <p className="text-white/80 mb-2">
                  Für die Nutzung der privaten App werden folgende Daten gespeichert:
                </p>
                <ul className="list-disc list-inside text-white/80 space-y-1 ml-4">
                  <li>Benutzername</li>
                  <li>Passwort (verschlüsselt)</li>
                  <li>E-Mail-Adresse (optional)</li>
                  <li>Authentifizierungs-Token (temporär)</li>
                </ul>
                <p className="text-white/80 mt-2">
                  <strong>Cookies:</strong> Für die Authentifizierung verwenden wir einen 
                  sicheren, HTTP-only Cookie mit dem Namen 'authToken', der für 7 Tage gültig ist.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#ff9900] mb-2">Festival-Anmeldung</h3>
                <p className="text-white/80 mb-2">
                  Als Teilnehmer des Hügelfests speichern wir:
                </p>
                <ul className="list-disc list-inside text-white/80 space-y-1 ml-4">
                  <li>Name</li>
                  <li>E-Mail-Adresse (optional)</li>
                  <li>Anmeldedatum</li>
                  <li>Anwesenheitstage</li>
                  <li>Präferenzen (Essen, Schlafen, etc.)</li>
                  <li>Weitere freiwillige Angaben</li>
                </ul>
                <p className="text-white/80 mt-2">
                  <strong>Cookies:</strong> Ein 'festival_registered' Cookie wird für 365 Tage 
                  gesetzt, um deinen Anmeldestatus zu speichern.
                </p>
                <p className="text-white/80">
                  <strong>Lokaler Speicher:</strong> Anmeldedaten werden temporär im 
                  Browser-Speicher unter 'festival_register_form' gesichert.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#ff9900] mb-2">Musik-Features</h3>
                <p className="text-white/80 mb-2">
                  Für die gemeinsame Musik-Nutzung werden folgende Daten serverseitig verarbeitet:
                </p>
                <ul className="list-disc list-inside text-white/80 space-y-1 ml-4">
                  <li>SoundCloud Track-Informationen</li>
                  <li>Audio-Streaming-Daten</li>
                  <li>Cover-Art Bilder</li>
                  <li>Track-URLs und Metadaten</li>
                </ul>
                <p className="text-white/80 mt-2">
                  <strong>Server-Verarbeitung:</strong> Die Musik-Features werden vollständig 
                  auf unserem Server verarbeitet. Wir fungieren als Proxy für SoundCloud, 
                  um eine bessere Performance und Verfügbarkeit zu gewährleisten.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#ff9900] mb-2">Technische Daten</h3>
                <p className="text-white/80 mb-2">
                  <strong>WebSocket-Verbindungen:</strong> Für Echtzeit-Updates und 
                  Benachrichtigungen nutzen wir WebSocket-Verbindungen. Dabei werden 
                  temporär technische Verbindungsdaten verarbeitet.
                </p>
                <p className="text-white/80">
                  <strong>Server-Side Rendering:</strong> Die App nutzt Next.js für 
                  serverseitiges Rendering, wodurch temporär technische Daten auf dem 
                  Server verarbeitet werden.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Wie lange speichern wir deine Daten?</h2>
            <p className="text-white/80">
              <strong>Anmeldedaten:</strong> Werden für die Dauer des Festivals plus eine 
              angemessene Nachbereitungszeit gespeichert.
            </p>
            <p className="text-white/80">
              <strong>Benutzerkonten:</strong> Bleiben aktiv bis zur manuellen Löschung 
              oder bis du nicht mehr am Festival teilnimmst.
            </p>
            <p className="text-white/80">
              <strong>Musik-Daten:</strong> Werden serverseitig gecacht und regelmäßig 
              aktualisiert. Diese Daten sind nur für Festival-Teilnehmer zugänglich.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Hosting & Technische Details</h2>
            <div className="space-y-4">
              <p className="text-white/80">
                Diese private Website und alle ihre Komponenten (Datenbank, Musik-Features, etc.) 
                werden ausschließlich auf meinem eigenen Server bei netcup GmbH in Nürnberg 
                gehostet. Die Server befinden sich in Deutschland und unterliegen der DSGVO.
              </p>
              <p className="text-white/80">
                <strong>Datenverarbeitung:</strong> Sämtliche Datenverarbeitung, einschließlich 
                der Musik-Features und Datenbank-Operationen, findet ausschließlich auf unserem 
                Server statt. Es werden keine Daten an externe Dienste weitergegeben.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Deine Rechte als Teilnehmer</h2>
            <p className="text-white/80 mb-4">
              Als Freund und Teilnehmer des Festivals hast du natürlich jederzeit das Recht:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-1 ml-4">
              <li>Auskunft über deine gespeicherten Daten zu erhalten</li>
              <li>Deine Daten korrigieren zu lassen</li>
              <li>Deine Daten löschen zu lassen</li>
              <li>Der Verarbeitung zu widersprechen</li>
              <li>Deine Daten übertragen zu lassen</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Kontakt</h2>
            <p className="text-white/80">
              Bei Fragen zu deinen Daten oder der Nutzung der App kannst du mich 
              jederzeit direkt oder unter folgender E-Mail-Adresse kontaktieren:
            </p>
            <p className="mt-2 text-[#ff9900]">huegelfest@hey.fansel.dev</p>
          </div>

          <div>
            <h2 className="text-xl font-display mb-2">Änderungen dieser Datenschutzerklärung</h2>
            <p className="text-white/80">
              Diese Datenschutzerklärung wird bei Bedarf aktualisiert, um Änderungen 
              an der App oder der Datenverarbeitung zu berücksichtigen. Die aktuelle 
              Version findest du immer hier.
            </p>
            <p className="text-white/80 mt-2">
              Letzte Aktualisierung: Juni 2024
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