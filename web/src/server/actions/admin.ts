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



export async function saveAnnouncements(announcements: IAnnouncement[]): Promise<void> {
  try {
    logger.info('[Server Action] Speichere Ankündigungen:', { count: announcements.length });
    
    // Speichere jede neue Ankündigung über die API
    for (const announcement of announcements) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: announcement.content,
          group: announcement.groupId,
          important: announcement.important
        })
      });

      if (!response.ok) {
        throw new Error(`Fehler beim Speichern der Ankündigung: ${announcement.content}`);
      }
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
      
    return announcements.map(announcement => ({
      id: announcement._id.toString(),
      content: announcement.content,
      date: announcement.date || '',
      time: announcement.time || '',
      groupId: announcement.groupId?.name || 'default',
      groupColor: announcement.groupId?.color || '#ff9900',
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
    }));
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