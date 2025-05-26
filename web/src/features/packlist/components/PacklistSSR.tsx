import React from 'react';
import { getGlobalPacklistAction } from '../actions/getGlobalPacklistAction';
import PacklistClient from './PacklistClient';
import type { PacklistItem } from '../types/PacklistItem';

export default async function PacklistSSR() {
  let initialItems: PacklistItem[] = [];
  
  try {
    initialItems = await getGlobalPacklistAction();
  } catch (error) {
    console.error('Fehler beim Laden der Packliste:', error);
    // Fallback: Lade aus statischen Daten falls Server nicht verfügbar
    initialItems = [
      { id: '1', text: 'Zelt oder Tarp', checked: false },
      { id: '2', text: 'Schlafsack', checked: false },
      { id: '3', text: 'Isomatte', checked: false },
      { id: '4', text: 'Klamotten für 4 Tage', checked: false },
      { id: '5', text: 'Regenjacke', checked: false },
      { id: '6', text: 'Powerbank', checked: false },
      { id: '7', text: 'Sonnenbrille', checked: false },
      { id: '8', text: 'Sonnencreme', checked: false },
      { id: '9', text: 'Medikamente', checked: false },
      { id: '10', text: 'Zahnbürste & Zahnpasta', checked: false },
    ];
  }

  return <PacklistClient initialItems={initialItems} />;
} 