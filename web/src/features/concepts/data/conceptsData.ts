import type { ConceptSection } from '../types';

export const conceptsData: ConceptSection[] = [
  {
    id: 'awareness',
    title: 'Awareness',
    icon: 'Shield',
    content: {
      introduction: 'Awareness bezeichnet das Bewusstsein und die Aufmerksamkeit für Situationen, in denen die Grenzen anderer überschritten werden oder wurden.',
      sections: [
        {
          title: 'Was ist Awareness?',
          content: 'Awareness bezeichnet das Bewusstsein und die Aufmerksamkeit für Situationen, in denen die Grenzen anderer überschritten werden oder wurden. Beachten muss man, dass die körperlichen & psychischen Grenzen einer Person nicht immer sichtbar sind. Alle Formen von Diskriminierung und (sexualisierter) Gewalt können dabei eine Rolle spielen, es geht aber auch um Sensibilität für das Wohlbefinden einer Person. Awarenessarbeit zielt darauf ab, dass sich alle Menschen unabhängig von Geschlecht, sexueller Orientierung, Hautfarbe, Herkunft, Aussehen und körperlichen Fähigkeiten möglichst wohl, frei und sicher fühlen können.'
        },
        {
          title: 'Wer sind wir?',
          content: 'Awareness Ansprechpersonen erkennt ihr an den Westen auf dem Festival und auf dem aushängenden Schichtplan. Für Ideen und Vorschläge zum Awareness-Konzept könnt ihr Johannes und Maya jederzeit ansprechen.\n\nWir sind eine Gruppe von Freund*innen die auf dem Festival einen möglichst diskriminierungsfreien Raum für alle schaffen wollen. Wir sind keine Profis. Zum Thema Awareness haben wir ein Konzept erarbeitet worauf wir die Arbeit mit den Freiwilligen im Awareness-Team stützen wollen. Dabei sind eure Vorschläge und Ideen immer willkommen.'
        }
      ]
    }
  },
  {
    id: 'finances',
    title: 'Finanzen',
    icon: 'Euro',
    content: {
      introduction: 'Transparente Übersicht über die Kosten und Finanzierung des Festivals.',
      sections: [
        {
          title: 'Hochrechnung Finanzen',
          content: {
            type: 'table',
            headers: ['Kosten', 'Für', 'Wie jetzt genau?'],
            rows: [
              ['1200 Euro', 'Essen', ''],
              ['500 Euro', 'Miete', 'für das Haus und Grundstück von Jakobs Familie'],
              ['350 Euro', 'Sprit', 'für alle Autos die Material/Einkäufe nach Truchtlachingen fahren'],
              ['500 Euro', 'Infrastruktur', 'Mietkosten für die Technik, Kosten für Pavillions, Sonnensegel, elektrische Herdplatte, Workshop Material & Plakate']
            ],
            footer: 'Daraus ergeben sich: 2550€ / 80 Personen = 31,87€\n\nDamit rechnen wir mit 32€ fürs Wochenende oder 11€ pro Person pro vollen Tag in Truchtlachingen.'
          }
        }
      ]
    }
  }
]; 