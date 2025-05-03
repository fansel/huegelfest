import { Announcement, GroupColors } from '@/types/types';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'huegelfest';

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