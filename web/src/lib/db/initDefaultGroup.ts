import Group from './models/Group';

/**
 * Stellt sicher, dass die Default-Gruppe existiert.
 * Legt sie an, falls sie nicht vorhanden ist.
 */
export async function ensureDefaultGroup(): Promise<void> {
  const exists = await Group.findOne({ name: 'default' }).lean();
  if (!exists) {
    await Group.create({
      name: 'default',
      color: '#ff9900', // Standardfarbe, ggf. anpassen
    });
  }
} 