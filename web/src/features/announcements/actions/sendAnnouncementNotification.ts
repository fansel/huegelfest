"use server";

import { sendAnnouncementNotification } from '../services/announcementService';

export async function sendAnnouncementNotificationAction(title: string, message: string) {
  return await sendAnnouncementNotification(title, message);
} 