'use server';

import { revalidatePath } from 'next/cache';
import { connectDB } from '@/database/config/apiConnector';
import Group from '@/database/models/Group';
import Announcement from '@/database/models/Announcement';
import { logger } from '@/server/lib/logger';
import { sseService } from '@/server/lib/sse';
import Music from '@/database/models/Music';
import { IAnnouncement } from '@/types/announcement';
import { webPushService } from '@/server/lib/webpush';
import { GroupService } from '@/server/services/GroupService';
import mongoose from 'mongoose';



export async function saveAnnouncements(announcements: IAnnouncement[]): Promise<void> {
  try {
    logger.info('[Server Action] Speichere Ankündigungen:', { count: announcements.length });
    
    await connectDB();
    
    // Erstelle neue Ankündigungen
    const announcementDocuments = await Promise.all(announcements.map(async announcement => {
      // Wenn die Ankündigung bereits eine ID hat, aktualisiere sie
      if (announcement.id) {
        const existingAnnouncement = await Announcement.findById(announcement.id);
        if (existingAnnouncement) {
          const group = await Group.findOne({ name: announcement.groupId });
          if (!group) {
            throw new Error(`Gruppe "${announcement.groupId}" nicht gefunden`);
          }
          
          existingAnnouncement.content = announcement.content;
          existingAnnouncement.groupId = group._id;
          existingAnnouncement.important = announcement.important || false;
          existingAnnouncement.date = announcement.date;
          existingAnnouncement.time = announcement.time;
          existingAnnouncement.updatedAt = new Date();
          
          await existingAnnouncement.save();
          return existingAnnouncement;
        }
      }
      
      // Für neue Ankündigungen
      const group = await Group.findOne({ name: announcement.groupId });
      if (!group) {
        throw new Error(`Gruppe "${announcement.groupId}" nicht gefunden`);
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
      return newAnnouncement;
    }));
    
    // Sende SSE-Update
    sseService.sendUpdateToAllClients();
    
    // Sende Push-Benachrichtigung
    try {
      webPushService.initialize();
      if (webPushService.isInitialized()) {
        await webPushService.sendNotificationToAll({
          title: 'Neue Ankündigungen',
          body: 'Die Ankündigungen wurden aktualisiert',
          icon: '/icon-192x192.png',
          badge: '/badge-96x96.png',
          data: {
            url: '/'
          }
        });
      }
    } catch (error) {
      logger.error('[Server Action] Fehler beim Senden der Push-Benachrichtigung:', error);
    }

    logger.info('[Server Action] Ankündigungen erfolgreich gespeichert');
  } catch (error) {
    logger.error('[Server Action] Fehler beim Speichern der Ankündigungen:', { error });
    if (error instanceof Error) {
      throw new Error(`Fehler beim Speichern der Ankündigungen: ${error.message}`);
    }
    throw new Error('Ein unerwarteter Fehler ist beim Speichern der Ankündigungen aufgetreten');
  }
}

export async function loadAnnouncements(): Promise<IAnnouncement[]> {
  try {
    await connectDB();
    const announcements = await Announcement.find()
      .populate('groupId')
      .sort({ createdAt: -1 })
      .lean();
      
    return announcements.map(announcement => {
      const group = announcement.groupId as any; // Type assertion für das populierte groupId
      return {
        id: announcement._id.toString(),
        content: announcement.content,
        date: announcement.date || '',
        time: announcement.time || '',
        groupId: group.name || 'default',
        groupName: group.name || 'default',
        groupColor: group.color || '#ff9900',
        important: announcement.important || false,
        reactions: announcement.reactions || {
          thumbsUp: { count: 0, deviceReactions: {} },
          clap: { count: 0, deviceReactions: {} },
          laugh: { count: 0, deviceReactions: {} },
          surprised: { count: 0, deviceReactions: {} },
          heart: { count: 0, deviceReactions: {} }
        },
        createdAt: new Date(announcement.createdAt),
        updatedAt: new Date(announcement.updatedAt)
      };
    });
  } catch (error) {
    logger.error('[Server Action] Fehler beim Laden der Ankündigungen:', error);
    if (error instanceof Error) {
      throw new Error(`Fehler beim Laden der Ankündigungen: ${error.message}`);
    }
    throw new Error('Ein unerwarteter Fehler ist beim Laden der Ankündigungen aufgetreten');
  }
}

export async function loadGroupColors(): Promise<Record<string, string>> {
  try {
    await connectDB();
    // @ts-ignore
    const groups = await Group.find().exec();
    const colors: Record<string, string> = { default: '#460b6c' };
    groups.forEach((group) => {
      colors[group.name] = group.color;
    });
    return colors;
  } catch (error) {
    logger.error('[Server Action] Fehler beim Laden der Gruppenfarben:', error);
    if (error instanceof Error) {
      throw new Error(`Fehler beim Laden der Gruppenfarben: ${error.message}`);
    }
    throw new Error('Ein unerwarteter Fehler ist beim Laden der Gruppenfarben aufgetreten');
  }
}

export async function saveGroupColors(groups: Record<string, string>): Promise<void> {
  try {
    await connectDB();
    await Group.deleteMany({});
    const groupDocuments = Object.entries(groups).map(([name, color]) => ({
      name,
      color,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await Group.insertMany(groupDocuments);
    revalidatePath('/');
    logger.info('[Server Action] Gruppenfarben erfolgreich gespeichert');
  } catch (error) {
    logger.error('[Server Action] Fehler beim Speichern der Gruppenfarben:', error);
    if (error instanceof Error) {
      throw new Error(`Fehler beim Speichern der Gruppenfarben: ${error.message}`);
    }
    throw new Error('Ein unerwarteter Fehler ist beim Speichern der Gruppenfarben aufgetreten');
  }
}

export async function loadMusicUrls(): Promise<string[]> {
  try {
    await connectDB();
    const music = await Music.find().select('url').lean();
    return music.map((m) => m.url);
  } catch (error) {
    logger.error('[Server Action] Fehler beim Laden der Musik-URLs:', error);
    if (error instanceof Error) {
      throw new Error(`Fehler beim Laden der Musik-URLs: ${error.message}`);
    }
    throw new Error('Ein unerwarteter Fehler ist beim Laden der Musik-URLs aufgetreten');
  }
}

export async function saveMusicUrls(urls: string[]): Promise<void> {
  try {
    await connectDB();
    await Music.deleteMany({});
    const musicDocuments = urls.map((url) => ({
      url,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await Music.insertMany(musicDocuments);
    revalidatePath('/');
    logger.info('[Server Action] Musik-URLs erfolgreich gespeichert');
  } catch (error) {
    logger.error('[Server Action] Fehler beim Speichern der Musik-URLs:', error);
    if (error instanceof Error) {
      throw new Error(`Fehler beim Speichern der Musik-URLs: ${error.message}`);
    }
    throw new Error('Ein unerwarteter Fehler ist beim Speichern der Musik-URLs aufgetreten');
  }
}

export async function deleteAnnouncement(id: string): Promise<{ success: boolean }> {
  try {
    await connectDB();
    await Announcement.findByIdAndDelete(id);
    
    sseService.sendUpdateToAllClients();
    
    return { success: true };
  } catch (error) {
    logger.error('[Server Action] Fehler beim Löschen der Ankündigung:', error);
    if (error instanceof Error) {
      throw new Error(`Fehler beim Löschen der Ankündigung: ${error.message}`);
    }
    throw new Error('Ein unerwarteter Fehler ist beim Löschen der Ankündigung aufgetreten');
  }
}

export async function addNewGroup(groupName: string, color?: string): Promise<Record<string, string>> {
  try {
    await connectDB();
    const groupService = GroupService.getInstance();
    await groupService.createGroup(groupName, color);
    
    // Lade die aktualisierten Gruppenfarben
    return await loadGroupColors();
  } catch (error) {
    logger.error('[Server Action] Fehler beim Hinzufügen der Gruppe:', error);
    if (error instanceof Error) {
      throw new Error(`Fehler beim Hinzufügen der Gruppe: ${error.message}`);
    }
    throw new Error('Ein unerwarteter Fehler ist beim Hinzufügen der Gruppe aufgetreten');
  }
} 