import { IAnnouncement } from '@/types/announcement';
import { GroupColors } from '@/types/types';

export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatTimeForInput = (date: Date): string => {
  return date.toTimeString().slice(0, 5);
}; 