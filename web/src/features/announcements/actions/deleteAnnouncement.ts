"use server";

import { deleteAnnouncement } from '../services/announcementService';

export async function deleteAnnouncementAction(id: string) {
  return await deleteAnnouncement(id);
} 