'use server';
import { addGlobalPacklistItem } from '../services/PacklistService';

export async function addPacklistItemAction(text: string) {
  await addGlobalPacklistItem(text);
} 