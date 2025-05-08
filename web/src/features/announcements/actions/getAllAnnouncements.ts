"use server";

import { getAllAnnouncements } from '../services/announcementService';

export async function getAllAnnouncementsAction() {
  return await getAllAnnouncements();
} 