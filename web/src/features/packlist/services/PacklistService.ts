import Packlist from '@/lib/db/models/Packlist';
import { connectDB } from '@/lib/db/connector';
import type { PacklistItem } from '../types/PacklistItem';
import { initServices } from '@/lib/initServices';

export async function getGlobalPacklist(): Promise<PacklistItem[]> {
  await initServices();
  const packlist = await Packlist.findOne({ key: 'global' });
  if (!packlist) return [];
  return packlist.items.map((item, idx) => ({
    id: idx.toString(),
    text: item.text,
    checked: item.checked,
  }));
}

export async function updateGlobalPacklist(items: PacklistItem[]): Promise<void> {
  await initServices();
  await Packlist.findOneAndUpdate(
    { key: 'global' },
    { items: items.map(({ text, checked }) => ({ text, checked })) },
    { upsert: true }
  );
}

export async function addGlobalPacklistItem(text: string): Promise<void> {
  await initServices();
  const packlist = await Packlist.findOne({ key: 'global' });
  const items = packlist ? packlist.items : [];
  items.push({ text, checked: false });
  await Packlist.findOneAndUpdate(
    { key: 'global' },
    { items },
    { upsert: true }
  );
}

export async function removeGlobalPacklistItem(index: number): Promise<string | null> {
  await initServices();
  const packlist = await Packlist.findOne({ key: 'global' });
  if (!packlist || !packlist.items[index]) return null;
  
  const items = [...packlist.items];
  const removedItem = items[index];
  items.splice(index, 1);
  
  await Packlist.findOneAndUpdate(
    { key: 'global' },
    { items },
    { upsert: true }
  );
  
  return removedItem.text;
} 