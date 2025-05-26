import React from 'react';
import { getGlobalPacklistAction } from '../actions/getGlobalPacklistAction';
import { PacklistItem } from '../types/PacklistItem';
import PacklistClient from './PacklistClient';

export default async function PacklistServer() {
  let initialItems: PacklistItem[] = [];
  
  try {
    const data = await getGlobalPacklistAction();
    initialItems = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Fehler beim Laden der globalen Packliste:', error);
    initialItems = [];
  }

  return <PacklistClient initialItems={initialItems} />;
} 