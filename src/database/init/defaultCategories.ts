import { FaMusic, FaUsers, FaUtensils, FaCampground, FaGamepad, FaQuestion } from 'react-icons/fa';

export const defaultCategories = [
  {
    value: 'music',
    label: 'Musik',
    icon: 'FaMusic',
    isDefault: false,
  },
  {
    value: 'food',
    label: 'Essen & Trinken',
    icon: 'FaUtensils',
    isDefault: false,
  },
  {
    value: 'camping',
    label: 'Camping',
    icon: 'FaCampground',
    isDefault: false,
  },
  {
    value: 'games',
    label: 'Spiele',
    icon: 'FaGamepad',
    isDefault: false,
  },
  {
    value: 'other',
    label: 'Sonstiges',
    icon: 'FaQuestion',
    isDefault: true,
  },
]; 