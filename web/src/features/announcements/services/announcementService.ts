import { connectDB } from '@/lib/db/connector';
import Announcement from '@/lib/db/models/Announcement';
import { Group } from '@/lib/db/models/Group';
import { revalidatePath } from 'next/cache';
import { webPushService } from '@/lib/webpush/webPushService';
import { logger } from '@/lib/logger';
import { IAnnouncement, ReactionType } from '@/shared/types/types';
import mongoose from 'mongoose';
import { initServices } from '@/lib/initServices';
import { broadcast } from '@/lib/websocket/broadcast';
import Reaction from '@/lib/db/models/Reaction';

export async function getAllAnnouncements() {
  await initServices();
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
    important: announcement.important || false,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
    groupInfo: {
      id: announcement.groupId?._id?.toString() || 'default',
      name: announcement.groupId?.name || 'default',
      color: announcement.groupId?.color || '#ff9900'
    }
  }));
}

export async function sendAnnouncementNotification(title: string, message: string) {
  await initServices();
  if (webPushService.isInitialized()) {
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
  }
  return { status: 'success', message: 'Ankündigung erfolgreich gesendet' };
}

export async function deleteAnnouncement(id: string) {
  await initServices();
  if (id === 'all') {
    await Announcement.deleteMany({});
    revalidatePath('/');
    return { success: true, message: 'Alle Ankündigungen wurden erfolgreich gelöscht' };
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: 'Ungültige Ankündigungs-ID' };
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

export async function saveAnnouncements(announcements: IAnnouncement[]): Promise<void> {
  await initServices();
  try {
    for (const announcement of announcements) {
      let group = null;
      if (
        announcement.groupId &&
        mongoose.Types.ObjectId.isValid(announcement.groupId)
      ) {
        group = await Group.findById(announcement.groupId);
      }
      if (!group) {
        const defaultGroup = await Group.findOne({ name: 'default' });
        if (!defaultGroup) throw new Error('Default-Gruppe nicht gefunden');
        group = defaultGroup;
      }
      if (announcement.id) {
        const existingAnnouncement = await Announcement.findById(announcement.id);
        if (existingAnnouncement) {
          existingAnnouncement.content = announcement.content;
          existingAnnouncement.groupId = new mongoose.Types.ObjectId(String(group._id));
          existingAnnouncement.important = announcement.important || false;
          existingAnnouncement.date = announcement.date;
          existingAnnouncement.time = announcement.time;
          existingAnnouncement.updatedAt = new Date();
          await existingAnnouncement.save();
          // Push für aktualisierte Ankündigung
          if (webPushService.isInitialized()) {
            await webPushService.sendNotificationToAll({
              title: `Gruppe ${group.name}`,
              body: announcement.content,
              icon: '/icon-192x192.png',
              badge: '/badge-96x96.png',
              data: { type: 'announcement', groupId: group._id, announcementId: existingAnnouncement._id }
            });
          }
          continue;
        }
      }
      const newAnnouncement = new Announcement({
        content: announcement.content,
        groupId: group._id,
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
      // Push für neue Ankündigung
      if (webPushService.isInitialized()) {
        await webPushService.sendNotificationToAll({
          title: `Gruppe ${group.name}`,
          body: announcement.content,
          icon: '/icon-192x192.png',
          badge: '/badge-96x96.png',
          data: { type: 'announcement', groupId: group._id, announcementId: newAnnouncement._id }
        });
      }
    }
    if (typeof global !== 'undefined' && (global as any).sseService) {
      try {
        (global as any).sseService.sendUpdateToAllClients();
      } catch (error) {
        logger.error('[saveAnnouncements] Fehler beim Senden des SSE-Updates:', error);
      }
    }
    logger.info('[saveAnnouncements] Ankündigungen erfolgreich gespeichert');
    await broadcast('announcement', { updated: true });
  } catch (error) {
    logger.error('[saveAnnouncements] Fehler beim Speichern der Ankündigungen:', error);
    throw error;
  }
}

/**
 * Fügt eine Reaction hinzu, entfernt sie (toggle) oder ändert sie für ein Announcement und ein Device.
 * Ein Device kann pro Announcement nur eine Reaction haben.
 */
export async function updateAnnouncementReaction(
  announcementId: string,
  reactionType: ReactionType,
  deviceId: string
) {
  await initServices();
  // Prüfe, ob es schon eine Reaction für dieses Announcement und Device gibt
  const existing = await Reaction.findOne({ announcementId, deviceId });
  if (existing) {
    if (existing.type === reactionType) {
      // Toggle off: gleiche Reaction -> löschen
      await existing.deleteOne();
      await broadcast('announcement-reaction', { announcementId });
      return { removed: true };
    } else {
      // Reaction-Typ ändern
      existing.type = reactionType;
      await existing.save();
      await broadcast('announcement-reaction', { announcementId });
      return { updated: true };
    }
  } else {
    // Neue Reaction anlegen
    await Reaction.create({ announcementId, deviceId, type: reactionType });
    await broadcast('announcement-reaction', { announcementId });
    return { created: true };
  }
}

/**
 * Aggregiert alle Reactions für ein Announcement und liefert:
 * - counts: wie oft jeder Typ vergeben wurde
 * - userReaction: welchen Typ das aktuelle Device vergeben hat (falls vorhanden)
 */
export async function getAnnouncementReactions(
  announcementId: string,
  deviceId?: string
): Promise<{
  counts: Record<ReactionType, number>;
  userReaction?: ReactionType;
}> {
  await initServices();
  const reactions = await Reaction.find({ announcementId });
  const counts: Record<ReactionType, number> = {
    thumbsUp: 0,
    clap: 0,
    laugh: 0,
    surprised: 0,
    heart: 0
  };
  let userReaction: ReactionType | undefined = undefined;
  for (const reaction of reactions) {
    counts[reaction.type]++;
    if (deviceId && reaction.deviceId === deviceId) {
      userReaction = reaction.type;
    }
  }
  return { counts, userReaction };
} 