'use server';
import { removeGlobalPacklistItem } from '../services/PacklistService';

export async function removePacklistItemAction(index: number) {
  await removeGlobalPacklistItem(index);
} 