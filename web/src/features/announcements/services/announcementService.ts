import { connectDB } from '@/lib/db/connector';
import Announcement from '@/lib/db/models/Announcement';
import Group from '@/lib/db/models/Group';
import { revalidatePath } from 'next/cache';
import { webPushService } from '@/lib/webpush/webPushService';
import { logger } from '@/lib/logger';
import { isServicesInitialized } from '@/lib/init';
import { IAnnouncement } from '@/shared/types/types';
import mongoose from 'mongoose';

export async function getAllAnnouncements() {
  await connectDB();
  const announcements = await Announcement.find()
    .populate('groupId')
    .sort({ createdAt: -1 })
    .lean();
  return announcements.map((announcement: any) => ({
    id: announcement._id.toString(),
    content: announcement.content,
    date: announcement.date || '',
    time: announcement.time || '',
    groupId: announcement.groupId?._id?.toString() || 'default',
    groupName: announcement.groupId?.name || 'default',
    groupColor: announcement.groupId?.color || '#ff9900',
    important: announcement.important || false,
    reactions: announcement.reactions || {
      thumbsUp: { count: 0, deviceReactions: {} },
      clap: { count: 0, deviceReactions: {} },
      laugh: { count: 0, deviceReactions: {} },
      surprised: { count: 0, deviceReactions: {} },
      heart: { count: 0, deviceReactions: {} }
    },
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt
  }));
}

export async function sendAnnouncementNotification(title: string, message: string) {
  if (!isServicesInitialized()) {
    throw new Error('Service nicht verfügbar');
  }
  await webPushService.sendNotificationToAll({
    title,
    body: message,
    icon: '/icon-192x192.png',
    badge: '/badge-96x96.png',
    data: {
      type: 'announcement',
      timestamp: new Date().toISOString()
    }
  });
  return { status: 'success', message: 'Ankündigung erfolgreich gesendet' };
}

export async function deleteAnnouncement(id: string) {
  await connectDB();
  if (id === 'all') {
    await Announcement.deleteMany({});
    revalidatePath('/');
    return { success: true, message: 'Alle Ankündigungen wurden erfolgreich gelöscht' };
  }
  const deletedAnnouncement = await Announcement.findByIdAndDelete(id);
  if (!deletedAnnouncement) {
    return { success: false, message: `Keine Ankündigung mit ID ${id} gefunden` };
  }
  revalidatePath('/announcements');
  return {
    success: true,
    message: `Ankündigung erfolgreich gelöscht`,
    deletedAnnouncement: {
      id: deletedAnnouncement._id,
      content: deletedAnnouncement.content,
      date: deletedAnnouncement.date
    }
  };
}

export async function updateAnnouncementReactions(id: string, reactions: any, deviceId: string) {
  await connectDB();
  const announcement = await Announcement.findById(id);
  if (!announcement) {
    throw new Error('Ankündigung nicht gefunden');
  }
  announcement.reactions = reactions;
  await announcement.save();
  return { success: true };
}

export async function saveAnnouncements(announcements: IAnnouncement[]): Promise<void> {
  await connectDB();
  try {
    // Default-Gruppe holen
    const defaultGroup = await Group.findOne({ name: 'default' });
    if (!defaultGroup) throw new Error('Default-Gruppe nicht gefunden');
    for (const announcement of announcements) {
      // Finde die Gruppe anhand der ID
      let group = null;
      if (announcement.groupId) {
        group = await Group.findById(announcement.groupId);
      }
      if (!group) {
        group = defaultGroup;
      }
      // Wenn eine ID vorhanden ist, prüfe ob die Ankündigung existiert
      if (announcement.id) {
        const existingAnnouncement = await Announcement.findById(announcement.id);
        if (existingAnnouncement) {
          existingAnnouncement.content = announcement.content;
          existingAnnouncement.groupId = group._id as mongoose.Types.ObjectId;
          existingAnnouncement.important = announcement.important || false;
          existingAnnouncement.date = announcement.date;
          existingAnnouncement.time = announcement.time;
          existingAnnouncement.updatedAt = new Date();
          await existingAnnouncement.save();
          continue;
        }
      }
      // Erstelle neue Ankündigung
      const newAnnouncement = new Announcement({
        content: announcement.content,
        groupId: group._id.toString(),
        important: announcement.important || false,
        date: announcement.date,
        time: announcement.time,
        reactions: announcement.reactions || {
          thumbsUp: { count: 0, deviceReactions: {} },
          clap: { count: 0, deviceReactions: {} },
          laugh: { count: 0, deviceReactions: {} },
          surprised: { count: 0, deviceReactions: {} },
          heart: { count: 0, deviceReactions: {} }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newAnnouncement.save();
    }
    // Sende Push-Benachrichtigung (optional)
    try {
      if (webPushService.isInitialized()) {
        await webPushService.sendNotificationToAll({
          title: 'Neue Ankündigungen',
          body: 'Die Ankündigungen wurden aktualisiert',
          icon: '/icon-192x192.png',
          badge: '/badge-96x96.png',
          data: { url: '/' }
        });
      }
    } catch (error) {
      logger.error('[saveAnnouncements] Fehler beim Senden der Push-Benachrichtigung:', error);
    }
    // Sende SSE-Update (optional, falls vorhanden)
    if (typeof global !== 'undefined' && (global as any).sseService) {
      try {
        (global as any).sseService.sendUpdateToAllClients();
      } catch (error) {
        logger.error('[saveAnnouncements] Fehler beim Senden des SSE-Updates:', error);
      }
    }
    logger.info('[saveAnnouncements] Ankündigungen erfolgreich gespeichert');
  } catch (error) {
    logger.error('[saveAnnouncements] Fehler beim Speichern der Ankündigungen:', error);
    throw error;
  }
} 