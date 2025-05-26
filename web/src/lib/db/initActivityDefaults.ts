import { ActivityCategory } from './models/ActivityCategory';
import { ActivityTemplate } from './models/ActivityTemplate';

/**
 * Stellt sicher, dass die wichtigsten Default-Aktivitäts-Kategorien existieren.
 * Legt sie an, falls sie nicht vorhanden sind.
 */
export async function ensureDefaultActivityCategories(): Promise<void> {
  const defaultCategories = [
    {
      name: 'Essen',
      icon: 'Utensils',
      color: '#ff9900',
      isDefault: true,
    },
    {
      name: 'Putzen',
      icon: 'Broom',
      color: '#22c55e',
      isDefault: true,
    },
    {
      name: 'Einkaufen',
      icon: 'ShoppingCart',
      color: '#3b82f6',
      isDefault: true,
    },
    {
      name: 'Aufräumen',
      icon: 'Package',
      color: '#f59e0b',
      isDefault: true,
    },
    {
      name: 'Spülen',
      icon: 'Droplets',
      color: '#06b6d4',
      isDefault: true,
    },
    {
      name: 'Sonstiges',
      icon: 'MoreHorizontal',
      color: '#8b5cf6',
      isDefault: true,
    },
  ];

  for (const cat of defaultCategories) {
    const exists = await ActivityCategory.findOne({ name: cat.name }).lean();
    if (!exists) {
      await ActivityCategory.create(cat);
    }
  }
}

/**
 * Stellt sicher, dass Default-Templates für die Kategorien existieren.
 */
export async function ensureDefaultActivityTemplates(): Promise<void> {
  // Zuerst müssen die Kategorien existieren
  await ensureDefaultActivityCategories();

  const categories = await ActivityCategory.find({ isDefault: true }).lean();
  
  const defaultTemplates = [
    // Essen-Templates
    {
      categoryName: 'Essen',
      templates: [
        { name: 'Frühstück zubereiten', defaultDescription: 'Brötchen, Eier, Marmelade, Kaffee vorbereiten' },
        { name: 'Mittagessen kochen', defaultDescription: 'Hauptgericht für alle Festival-Teilnehmer zubereiten' },
        { name: 'Abendessen kochen', defaultDescription: 'Warmes Abendessen für die Gruppe vorbereiten' },
        { name: 'Snacks vorbereiten', defaultDescription: 'Kleine Snacks und Zwischenmahlzeiten bereitstellen' },
        { name: 'Getränke auffüllen', defaultDescription: 'Getränkestation auffüllen und organisieren' },
      ]
    },
    // Putzen-Templates
    {
      categoryName: 'Putzen',
      templates: [
        { name: 'Küche putzen', defaultDescription: 'Arbeitsflächen, Herd und Kühlschrank reinigen' },
        { name: 'Toiletten reinigen', defaultDescription: 'Sanitäranlagen gründlich putzen' },
        { name: 'Gemeinschaftsräume putzen', defaultDescription: 'Aufenthaltsräume sauber machen' },
        { name: 'Müll entsorgen', defaultDescription: 'Mülleimer leeren und Müll trennen' },
        { name: 'Boden wischen', defaultDescription: 'Böden fegen und wischen' },
      ]
    },
    // Einkaufen-Templates
    {
      categoryName: 'Einkaufen',
      templates: [
        { name: 'Lebensmittel einkaufen', defaultDescription: 'Einkauf für Mahlzeiten nach Einkaufsliste' },
        { name: 'Getränke einkaufen', defaultDescription: 'Getränkevorrat auffüllen' },
        { name: 'Hygieneartikel besorgen', defaultDescription: 'Toilettenpapier, Seife, etc. nachkaufen' },
        { name: 'Küchenutensilien besorgen', defaultDescription: 'Fehlende Küchengeräte oder -utensilien kaufen' },
      ]
    },
    // Aufräumen-Templates
    {
      categoryName: 'Aufräumen',
      templates: [
        { name: 'Schlafbereich aufräumen', defaultDescription: 'Schlafplätze ordentlich machen' },
        { name: 'Gemeinschaftsbereich aufräumen', defaultDescription: 'Gemeinsame Bereiche in Ordnung bringen' },
        { name: 'Küche aufräumen', defaultDescription: 'Geschirr wegräumen und Ordnung schaffen' },
        { name: 'Material sortieren', defaultDescription: 'Festival-Material und Equipment organisieren' },
      ]
    },
    // Spülen-Templates
    {
      categoryName: 'Spülen',
      templates: [
        { name: 'Geschirr spülen', defaultDescription: 'Teller, Besteck und Gläser abwaschen' },
        { name: 'Töpfe spülen', defaultDescription: 'Große Töpfe und Pfannen reinigen' },
        { name: 'Küchengeräte reinigen', defaultDescription: 'Mixer, Wasserkocher und andere Geräte säubern' },
      ]
    },
    // Sonstiges-Templates
    {
      categoryName: 'Sonstiges',
      templates: [
        { name: 'Dekoration aufbauen', defaultDescription: 'Festival-Dekoration anbringen' },
        { name: 'Technik prüfen', defaultDescription: 'Sound- und Lichttechnik kontrollieren' },
        { name: 'Sicherheit prüfen', defaultDescription: 'Fluchtwege und Sicherheitseinrichtungen kontrollieren' },
        { name: 'Material transportieren', defaultDescription: 'Equipment und Material von A nach B bringen' },
      ]
    },
  ];

  for (const categoryTemplates of defaultTemplates) {
    const category = categories.find(cat => cat.name === categoryTemplates.categoryName);
    if (!category) continue;

    for (const template of categoryTemplates.templates) {
      const exists = await ActivityTemplate.findOne({
        name: template.name,
        categoryId: category._id
      }).lean();

      if (!exists) {
        await ActivityTemplate.create({
          name: template.name,
          categoryId: category._id,
          defaultDescription: template.defaultDescription,
        });
      }
    }
  }
}

/**
 * Initialisiert alle Activity-Defaults (Kategorien + Templates)
 */
export async function initActivityDefaults(): Promise<void> {
  await ensureDefaultActivityCategories();
  await ensureDefaultActivityTemplates();
} 