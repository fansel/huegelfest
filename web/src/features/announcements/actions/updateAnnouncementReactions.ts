"use server";

import { updateAnnouncementReactions } from '../services/announcementService';

export async function updateAnnouncementReactionsAction(id: string, reactions: any, deviceId: string) {
  return await updateAnnouncementReactions(id, reactions, deviceId);
} 