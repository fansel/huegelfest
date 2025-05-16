"use server";
import { getAnnouncementById } from '../services/announcementService';

export async function getAnnouncementByIdAction(id: string) {
  return getAnnouncementById(id);
} 