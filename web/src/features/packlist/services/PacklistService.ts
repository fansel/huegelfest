import Packlist from '@/lib/db/models/Packlist';
import { connectDB } from '@/lib/db/connector';
import type { PacklistItem } from '../types/PacklistItem';

const DEFAULT_ITEMS: PacklistItem[] = [
  { id: '1', text: 'Schlafsack', checked: false },
  { id: '2', text: 'Zahnbürste', checked: false },
  { id: '3', text: 'Handtuch', checked: false },
  { id: '4', text: 'Taschenlampe', checked: false },
];

export async function getGlobalPacklist(): Promise<PacklistItem[]> {
  await connectDB();
  const packlist = await Packlist.findOne({ key: 'global' });
  if (!packlist) return DEFAULT_ITEMS;
  return packlist.items.map((item, idx) => ({
    id: idx.toString(),
    text: item.text,
    checked: item.checked,
  }));
}

export async function updateGlobalPacklist(items: PacklistItem[]): Promise<void> {
  await connectDB();
  await Packlist.findOneAndUpdate(
    { key: 'global' },
    { items: items.map(({ text, checked }) => ({ text, checked })) },
    { upsert: true }
  );
}

export async function addGlobalPacklistItem(text: string): Promise<void> {
  await connectDB();
  const packlist = await Packlist.findOne({ key: 'global' });
  const items = packlist ? packlist.items : [];
  items.push({ text, checked: false });
  await Packlist.findOneAndUpdate(
    { key: 'global' },
    { items },
    { upsert: true }
  );
}

export async function removeGlobalPacklistItem(index: number): Promise<void> {
  await connectDB();
  const packlist = await Packlist.findOne({ key: 'global' });
  if (!packlist) return;
  const items = [...packlist.items];
  items.splice(index, 1);
  await Packlist.findOneAndUpdate(
    { key: 'global' },
    { items },
    { upsert: true }
  );
} 