"use server";

import { IAnnouncement } from '@/shared/types/types';
import { saveAnnouncements } from '../services/announcementService';

export async function saveAnnouncementsAction(announcements: IAnnouncement[]) {
  return await saveAnnouncements(announcements);
} 