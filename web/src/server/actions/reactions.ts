'use server';

import { connectDB } from '@/database/config/apiConnector';
import Announcement from '@/database/models/Announcement';
import { logger } from '@/server/lib/logger';
import { sseService } from '@/server/lib/sse';
import { ReactionType } from '@/types/types';

const REACTION_TYPES: ReactionType[] = ['thumbsUp', 'clap', 'laugh', 'surprised', 'heart'];

interface IDeviceReaction {
  type: ReactionType;
  announcementId: string;
}

const createDefaultReactions = () => {
  const reactions: Record<ReactionType, {
    count: number;
    deviceReactions: Record<string, IDeviceReaction>;
  }> = {} as any;
  
  REACTION_TYPES.forEach(type => {
    reactions[type] = {
      count: 0,
      deviceReactions: {}
    };
  });
  return reactions;
};

export async function addReaction(announcementId: string, type: ReactionType, deviceId: string): Promise<void> {
  try {
    await connectDB();
    
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      throw new Error(`Ankündigung mit ID ${announcementId} nicht gefunden`);
    }

    // Initialisiere reactions wenn nicht vorhanden
    if (!announcement.reactions) {
      announcement.reactions = createDefaultReactions();
    }

    // Stelle sicher, dass alle Reaktionstypen initialisiert sind
    REACTION_TYPES.forEach(reactionType => {
      if (!announcement.reactions[reactionType]) {
        announcement.reactions[reactionType] = {
          count: 0,
          deviceReactions: {}
        };
      }
    });

    // Entferne vorherige Reaktion des Geräts
    REACTION_TYPES.forEach(reactionType => {
      const reaction = announcement.reactions[reactionType];
      if (reaction?.deviceReactions?.[deviceId]) {
        delete reaction.deviceReactions[deviceId];
        reaction.count = Math.max(0, reaction.count - 1);
      }
    });

    // Stelle sicher, dass die Zielreaktion initialisiert ist
    if (!announcement.reactions[type]) {
      announcement.reactions[type] = {
        count: 0,
        deviceReactions: {}
      };
    }

    // Füge neue Reaktion hinzu
    const targetReaction = announcement.reactions[type];
    if (!targetReaction.deviceReactions) {
      targetReaction.deviceReactions = {};
    }

    targetReaction.deviceReactions[deviceId] = {
      type,
      announcementId
    };
    targetReaction.count = (targetReaction.count || 0) + 1;

    await Announcement.findByIdAndUpdate(announcementId, {
      $set: { reactions: announcement.reactions }
    });

    logger.info(`[Server Action] Reaktion ${type} für Ankündigung ${announcementId} hinzugefügt`);
    
    // Sende SSE-Update
    sseService.sendUpdateToAllClients();
  } catch (error) {
    logger.error('[Server Action] Fehler beim Hinzufügen der Reaktion:', error);
    throw error;
  }
}

export async function removeReaction(announcementId: string, type: ReactionType, deviceId: string): Promise<void> {
  try {
    await connectDB();
    
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      throw new Error(`Ankündigung mit ID ${announcementId} nicht gefunden`);
    }

    // Initialisiere reactions wenn nicht vorhanden
    if (!announcement.reactions) {
      announcement.reactions = createDefaultReactions();
    }

    const reaction = announcement.reactions[type];
    if (!reaction?.deviceReactions?.[deviceId]) {
      return; // Keine Reaktion zum Entfernen vorhanden
    }

    // Entferne die Reaktion
    delete reaction.deviceReactions[deviceId];
    reaction.count = Math.max(0, reaction.count - 1);

    await Announcement.findByIdAndUpdate(announcementId, {
      $set: { reactions: announcement.reactions }
    });

    logger.info(`[Server Action] Reaktion ${type} für Ankündigung ${announcementId} entfernt`);
    
    // Sende SSE-Update
    sseService.sendUpdateToAllClients();
  } catch (error) {
    logger.error('[Server Action] Fehler beim Entfernen der Reaktion:', error);
    throw error;
  }
} 