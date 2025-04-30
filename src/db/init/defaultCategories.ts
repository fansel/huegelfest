import { FaMusic, FaUsers, FaUtensils, FaCampground, FaGamepad, FaQuestion } from 'react-icons/fa';

export const defaultCategories = [
  { value: 'music', label: 'Musik', icon: 'FaMusic', isDefault: true },
  { value: 'workshop', label: 'Workshop', icon: 'FaUsers', isDefault: true },
  { value: 'food', label: 'Essen & Trinken', icon: 'FaUtensils', isDefault: true },
  { value: 'camp', label: 'Camp', icon: 'FaCampground', isDefault: true },
  { value: 'game', label: 'Spiele', icon: 'FaGamepad', isDefault: true },
  { value: 'other', label: 'Sonstiges', icon: 'FaQuestion', isDefault: true }
] as const;

export type DefaultCategory = typeof defaultCategories[number]['value']; 