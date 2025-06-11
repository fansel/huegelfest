"use server";

import { verifyAdminSession } from '@/features/auth/actions/userAuth';
import { IAnnouncement } from '@/shared/types/types';
import { saveAnnouncements, deleteAnnouncement } from '../services/announcementService';
import { broadcast } from '@/lib/websocket/broadcast';

export async function createAnnouncementAction(announcementData: IAnnouncement) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      throw new Error('Nicht autorisiert');
    }

    // Verwende den bestehenden Service mit Array-Argument
    await saveAnnouncements([announcementData]);
    
    // WebSocket-Broadcast für Announcement Created
    try {
      await broadcast('announcement', { 
        action: 'created',
        id: announcementData.id,
        content: announcementData.content,
        groupId: announcementData.groupId
      });
      console.log('[Announcement] Broadcast "announcement" gesendet für created');
    } catch (error) {
      console.error('[Announcement] Fehler beim Broadcast:', error);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[createAnnouncementAction] Fehler:', error);
    return { success: false, error: 'Fehler beim Erstellen der Ankündigung' };
  }
}

export async function updateAnnouncementAction(id: string, announcementData: Partial<IAnnouncement>) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      throw new Error('Nicht autorisiert');
    }

    // Erstelle vollständiges Announcement-Objekt mit ID
    const fullAnnouncement: IAnnouncement = {
      id,
      content: announcementData.content || '',
      date: announcementData.date || '',
      time: announcementData.time || '',
      groupId: announcementData.groupId || '',
      groupName: announcementData.groupName || '',
      groupColor: announcementData.groupColor || '',
      important: announcementData.important || false,
      reactions: announcementData.reactions || {},
      createdAt: announcementData.createdAt,
      updatedAt: announcementData.updatedAt
    };
    
    // Verwende den bestehenden Service mit Array-Argument
    await saveAnnouncements([fullAnnouncement]);
    
    // WebSocket-Broadcast für Announcement Updated
    try {
      await broadcast('announcement', { 
        action: 'updated',
        id,
        content: announcementData.content,
        groupId: announcementData.groupId
      });
      console.log('[Announcement] Broadcast "announcement" gesendet für updated');
    } catch (error) {
      console.error('[Announcement] Fehler beim Broadcast:', error);
    }
    
    return { success: true };
  } catch (error) {
    console.error('[updateAnnouncementAction] Fehler:', error);
    return { success: false, error: 'Fehler beim Aktualisieren der Ankündigung' };
  }
}

export async function deleteAnnouncementAction(id: string) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      throw new Error('Nicht autorisiert');
    }

    const result = await deleteAnnouncement(id);
    
    if (result.success) {
      // WebSocket-Broadcast für Announcement Deleted
      try {
        await broadcast('announcement', { 
          action: 'deleted',
          id
        });
        console.log('[Announcement] Broadcast "announcement" gesendet für deleted');
      } catch (error) {
        console.error('[Announcement] Fehler beim Broadcast:', error);
      }
    }
    
    return result;
  } catch (error) {
    console.error('[deleteAnnouncementAction] Fehler:', error);
    return { success: false, error: 'Fehler beim Löschen der Ankündigung' };
  }
} 