//Hier kommt eine verlinkung zur datenschutzseite und zum impressum 

import { useState } from 'react';
import { FileText, Github, Mail, MapPin, Code } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import UserSettingsCard from './UserSettingsCard';

interface LegalNoticeProps {
  variant?: 'row' | 'tile';
}

const ImpressumContent = () => (
  <div className="text-[#ff9900]/80">
    <div className="space-y-6">
      <div>
        <p className="mb-6 text-sm italic">
          Hey! Schön, dass du hier bist. Diese Website ist ein Herzensprojekt von mir, 
          um unser gemeinsames Festival noch schöner zu gestalten. Bei Fragen oder Anregungen 
          melde dich gerne direkt bei mir! 🎉
        </p>

        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-[#ff9900]">
          <MapPin className="w-5 h-5" />
          Angaben gemäß § 5 TMG
        </h3>
        <div className="space-y-1">
          <p><strong>Felix Mansel</strong></p>
          <p>Neustädterstraße 19</p>
          <p>04315 Leipzig</p>
          <p>Deutschland</p>
        </div>
        
        <div className="mt-6 space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-[#ff9900]">Kontakt</h4>
            <div className="space-y-2">
              <a 
                href="mailto:huegelfest@hey.fansel.dev"
                className="text-[#ff9900] hover:text-[#ff9900]/60 transition-colors inline-flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                huegelfest@hey.fansel.dev
              </a>
              <div>
                <a 
                  href="https://github.com/fansel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ff9900] hover:text-[#ff9900]/60 transition-colors inline-flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  github.com/fansel
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2 text-[#ff9900]">Haftung für Inhalte</h4>
        <p className="text-sm">
          Als Diensteanbieter:in bin ich gemäß § 7 Abs.1 TMG für eigene Inhalte 
          auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
        </p>
      </div>
      
      <div>
        <h4 className="font-semibold mb-2 text-[#ff9900]">Urheberrecht</h4>
        <p className="text-sm">
          Die durch mich erstellten Inhalte und Werke auf diesen Seiten unterliegen 
          dem deutschen Urheberrecht. Downloads und Kopien dieser Seite sind nur für 
          den privaten, nicht kommerziellen Gebrauch gestattet.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-[#ff9900]">
          <Code className="w-5 h-5" />
          Tech Stack
        </h3>
        <div className="flex flex-wrap gap-2">
          {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'MongoDB'].map((tech) => (
            <span 
              key={tech}
              className="px-3 py-1 bg-[#ff9900]/10 text-[#ff9900] rounded-full text-sm border border-[#ff9900]/30"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const DatenschutzContent = () => (
  <div className="text-[#ff9900]/80">
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-2 text-[#ff9900]">Wichtiger Hinweis</h2>
        <p className="mb-4">
          Diese Website ist eine private Plattform, die ausschließlich für die Organisation 
          und Durchführung des Hügelfests unter Freund:innen konzipiert ist. Sie ist nicht 
          öffentlich zugänglich und dient nicht kommerziellen Zwecken.
        </p>
        <p>
          Als private Plattform legen wir besonderen Wert auf den vertrauensvollen Umgang 
          mit den Daten unserer Freund:innen und Festival-Teilnehmer:innen.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2 text-[#ff9900]">Welche Daten werden gespeichert?</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[#ff9900] mb-2">Authentifizierung & Benutzer:innen-Konten</h3>
            <p className="mb-2">
              Für die Nutzung der privaten App werden folgende Daten gespeichert:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-[#ff9900]/80">
              <li>Benutzer:innen-Name</li>
              <li>Passwort (verschlüsselt)</li>
              <li>E-Mail-Adresse (optional)</li>
              <li>Authentifizierungs-Token (temporär)</li>
            </ul>
            <p className="mt-2">
              <strong>Cookies:</strong> Für die Authentifizierung verwenden wir einen 
              sicheren, HTTP-only Cookie mit dem Namen 'authToken', der für 7 Tage gültig ist.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#ff9900] mb-2">Festival-Anmeldung</h3>
            <p className="mb-2">
              Als Teilnehmer:in des Hügelfests speichern wir:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-[#ff9900]/80">
              <li>Name</li>
              <li>E-Mail-Adresse (optional)</li>
              <li>Anmeldedatum</li>
              <li>Anwesenheitstage</li>
              <li>Präferenzen (Essen, Schlafen, etc.)</li>
              <li>Weitere freiwillige Angaben</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#ff9900] mb-2">Musik-Features</h3>
            <p className="mb-2">
              Für die gemeinsame Musik-Nutzung werden folgende Daten serverseitig verarbeitet:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-[#ff9900]/80">
              <li>SoundCloud Track-Informationen</li>
              <li>Audio-Streaming-Daten</li>
              <li>Cover-Art Bilder</li>
              <li>Track-URLs und Metadaten</li>
            </ul>
            <p className="mt-2">
              <strong>Server-Verarbeitung:</strong> Die Musik-Features werden vollständig 
              auf unserem Server verarbeitet. Wir fungieren als Proxy für SoundCloud, 
              um eine bessere Performance und Verfügbarkeit zu gewährleisten.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#ff9900] mb-2">Technische Daten</h3>
            <p className="mb-2">
              <strong>WebSocket-Verbindungen:</strong> Für Echtzeit-Updates und 
              Benachrichtigungen nutzen wir WebSocket-Verbindungen. Dabei werden 
              temporär technische Verbindungsdaten verarbeitet.
            </p>
            <p>
              <strong>Server-Side Rendering:</strong> Die App nutzt Next.js für 
              serverseitiges Rendering, wodurch temporär technische Daten auf dem 
              Server verarbeitet werden.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2 text-[#ff9900]">Hosting & Technische Details</h2>
        <div className="space-y-4">
          <p>
            Diese private Website und alle ihre Komponenten (Datenbank, Musik-Features, etc.) 
            werden ausschließlich auf meinem eigenen Server bei netcup GmbH in Nürnberg 
            gehostet. Die Server befinden sich in Deutschland und unterliegen der DSGVO.
          </p>
          <p>
            <strong>Datenverarbeitung:</strong> Sämtliche Datenverarbeitung, einschließlich 
            der Musik-Features und Datenbank-Operationen, findet ausschließlich auf unserem 
            Server statt. Es werden keine Daten an externe Dienste weitergegeben.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2 text-[#ff9900]">Kontakt</h2>
        <p>
          Bei Fragen zu deinen Daten oder der Nutzung der App kannst du mich 
          jederzeit direkt oder unter folgender E-Mail-Adresse kontaktieren:
        </p>
        <p className="mt-2 text-[#ff9900]">huegelfest@hey.fansel.dev</p>
      </div>
    </div>
  </div>
);

export default function LegalNotice({ variant = 'row' }: LegalNoticeProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <UserSettingsCard
        icon={<FileText className="w-5 h-5 text-[#ff9900]" />}
        title="Rechtliches"
        switchElement={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-3 py-1 rounded-full border border-[#ff9900]/60 text-[#ff9900] bg-transparent hover:bg-[#ff9900]/10 focus:outline-none focus:ring-2 focus:ring-[#ff9900]/40 transition"
          >
            Ansehen
          </button>
        }
        info="Impressum & Datenschutz"
        variant={variant}
      />
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#460b6c] border-[#ff9900]/20 max-w-4xl h-screen sm:h-auto sm:max-h-[80vh] overflow-y-auto data-[state=open]:bg-[#460b6c] before:bg-transparent after:bg-transparent [&>button]:border [&>button]:border-[#ff9900]/20 [&>button]:rounded-full [&>button]:p-1.5 [&>button]:text-[#ff9900] [&>button]:hover:bg-[#ff9900]/10 [&>button]:transition-colors fixed top-0 left-0 right-0 bottom-0 m-0 w-full max-w-full rounded-none sm:rounded-lg sm:relative sm:m-auto sm:w-auto">
          <DialogHeader>
            <DialogTitle className="text-[#ff9900]">Rechtliche Informationen</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="impressum" className="mt-4">
            <TabsList className="grid w-full grid-cols-2 bg-[#ff9900]/10">
              <TabsTrigger 
                value="impressum" 
                className="data-[state=active]:bg-[#ff9900] data-[state=active]:text-[#460b6c] text-[#ff9900]"
              >
                Impressum
              </TabsTrigger>
              <TabsTrigger 
                value="datenschutz"
                className="data-[state=active]:bg-[#ff9900] data-[state=active]:text-[#460b6c] text-[#ff9900]"
              >
                Datenschutz
              </TabsTrigger>
            </TabsList>
            <TabsContent value="impressum" className="mt-6">
              <ImpressumContent />
            </TabsContent>
            <TabsContent value="datenschutz" className="mt-6">
              <DatenschutzContent />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
