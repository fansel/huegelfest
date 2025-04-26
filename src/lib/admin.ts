import { Announcement, GroupColors, GroupColorSetting } from './types';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'huegelfest';

// Funktion zum Generieren einer zufälligen Farbe
const generateRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Standardfarben
const DEFAULT_COLORS: GroupColors = {};

export const validateCredentials = (username: string, password: string): boolean => {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
};

export const getExistingGroups = (announcements: Announcement[]): string[] => {
  const groups = new Set(announcements.map(announcement => announcement.group));
  return Array.from(groups);
};

export const generateNewId = (announcements: Announcement[]): number => {
  return Math.max(...announcements.map(a => a.id), 0) + 1;
};

export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatTimeForInput = (date: Date): string => {
  return date.toTimeString().slice(0, 5);
};

export const saveAnnouncements = async (announcements: Announcement[]): Promise<void> => {
  try {
    const response = await fetch('/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(announcements),
    });

    if (!response.ok) {
      throw new Error('Fehler beim Speichern der Ankündigungen');
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Ankündigungen:', error);
    throw error;
  }
};

export const loadAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const response = await fetch('/api/announcements');
    if (!response.ok) {
      throw new Error('Fehler beim Laden der Ankündigungen');
    }
    return await response.json();
  } catch (error) {
    console.error('Fehler beim Laden der Ankündigungen:', error);
    return [];
  }
};

// Funktionen für Gruppenfarben
export async function loadGroupColors(): Promise<GroupColors> {
  try {
    const response = await fetch('/api/groups');
    if (!response.ok) {
      throw new Error('Fehler beim Laden der Gruppen');
    }
    const groups = await response.json();
    return groups;
  } catch (error) {
    console.error('Fehler beim Laden der Gruppen:', error);
    return { default: '#460b6c' };
  }
}

export async function saveGroupColors(groups: GroupColors): Promise<void> {
  try {
    const response = await fetch('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(groups),
    });
    if (!response.ok) {
      throw new Error('Fehler beim Speichern der Gruppen');
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Gruppen:', error);
  }
}

export const updateGroupColor = (group: string, color: string): GroupColors => {
  const currentColors = loadGroupColors();
  const newColors = { ...currentColors, [group]: color };
  saveGroupColors(newColors);
  return newColors;
};

export const renameGroup = (oldName: string, newName: string): void => {
  // Aktualisiere die Farben
  const colors = loadGroupColors();
  if (colors[oldName]) {
    const newColors = { ...colors };
    newColors[newName] = newColors[oldName];
    delete newColors[oldName];
    saveGroupColors(newColors);
  }

  // Aktualisiere die Ankündigungen
  const announcements = loadAnnouncements();
  const updatedAnnouncements = announcements.map(announcement => {
    if (announcement.group === oldName) {
      return { ...announcement, group: newName };
    }
    return announcement;
  });
  saveAnnouncements(updatedAnnouncements);
};

export const deleteGroup = async (groupName: string): Promise<void> => {
  // Entferne die Farbe
  const colors = loadGroupColors();
  const newColors = { ...colors };
  delete newColors[groupName];
  saveGroupColors(newColors);

  // Aktualisiere die Ankündigungen
  const announcements = await loadAnnouncements();
  const updatedAnnouncements = announcements.map(announcement => {
    if (announcement.group === groupName) {
      return { ...announcement, group: 'default' };
    }
    return announcement;
  });
  saveAnnouncements(updatedAnnouncements);
};

export const addNewGroup = (groupName: string): GroupColors => {
  const colors = loadGroupColors();
  const newColors = { ...colors, [groupName]: generateRandomColor() };
  saveGroupColors(newColors);
  return newColors;
}; 