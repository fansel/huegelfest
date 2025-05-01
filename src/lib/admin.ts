import { Announcement, GroupColors, TimelineData } from './types';

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

export const validateCredentials = (username: string, password: string): boolean => {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
};

export const getExistingGroups = (announcements: Announcement[]): string[] => {
  const groups = new Set(announcements.map(announcement => announcement.group));
  return Array.from(groups);
};

export const generateNewId = (announcements: Announcement[]): string => {
  const maxId = Math.max(...announcements.map(a => parseInt(a.id, 10)), 0);
  return String(maxId + 1);
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
    throw error;
  }
}

export const updateGroupColor = async (group: string, color: string): Promise<GroupColors> => {
  const currentColors = await loadGroupColors();
  const newColors = { ...currentColors, [group]: color };
  await saveGroupColors(newColors);
  return newColors;
};

export const renameGroup = async (oldName: string, newName: string): Promise<void> => {
  const announcements = await loadAnnouncements();
  const updatedAnnouncements = announcements.map(announcement => {
    if (announcement.group === oldName) {
      return { ...announcement, group: newName };
    }
    return announcement;
  });
  await saveAnnouncements(updatedAnnouncements);

  const currentColors = await loadGroupColors();
  if (currentColors[oldName]) {
    const newColors = { ...currentColors };
    newColors[newName] = newColors[oldName];
    delete newColors[oldName];
    await saveGroupColors(newColors);
  }
};

export const deleteGroup = async (groupName: string): Promise<void> => {
  const announcements = await loadAnnouncements();
  const updatedAnnouncements = announcements.filter(announcement => announcement.group !== groupName);
  await saveAnnouncements(updatedAnnouncements);

  const currentColors = await loadGroupColors();
  if (currentColors[groupName]) {
    const newColors = { ...currentColors };
    delete newColors[groupName];
    await saveGroupColors(newColors);
  }
};

export const addNewGroup = async (groupName: string): Promise<GroupColors> => {
  const currentColors = await loadGroupColors();
  const newColors = { ...currentColors, [groupName]: generateRandomColor() };
  await saveGroupColors(newColors);
  return newColors;
};

export async function loadMusicUrls(): Promise<string[]> {
  try {
    const response = await fetch('/api/music');
    if (!response.ok) {
      throw new Error('Fehler beim Laden der Musik-URLs');
    }
    return await response.json();
  } catch (error) {
    console.error('Fehler beim Laden der Musik-URLs:', error);
    return [];
  }
}

export async function saveMusicUrls(urls: string[]): Promise<void> {
  try {
    const response = await fetch('/api/music', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(urls),
    });

    if (!response.ok) {
      throw new Error('Fehler beim Speichern der Musik-URLs');
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Musik-URLs:', error);
    throw error;
  }
}

export const loadTimeline = async (): Promise<TimelineData> => {
  try {
    const response = await fetch('/api/timeline');
    if (!response.ok) {
      throw new Error('Fehler beim Laden der Timeline');
    }
    return await response.json();
  } catch (error) {
    console.error('Fehler beim Laden der Timeline:', error);
    return { _id: '', days: [], createdAt: new Date(), updatedAt: new Date() };
  }
};

export const saveTimeline = async (timeline: TimelineData): Promise<void> => {
  try {
    console.log('saveTimeline - Starte Speichern der Timeline');
    console.log('saveTimeline - Timeline Daten:', JSON.stringify(timeline, null, 2));
    
    const response = await fetch('/api/timeline', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(timeline),
    });

    console.log('saveTimeline - Response Status:', response.status);
    console.log('saveTimeline - Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.json();
    console.log('saveTimeline - Response Daten:', responseData);

    if (!response.ok) {
      console.error('saveTimeline - Fehler beim Speichern:', responseData);
      throw new Error(responseData.error || 'Fehler beim Speichern der Timeline');
    }

    console.log('saveTimeline - Erfolgreich gespeichert');
  } catch (error) {
    console.error('saveTimeline - Fehler beim Speichern der Timeline:', error);
    throw error;
  }
}; 