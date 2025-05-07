import { IReaction } from '@/types/announcement';
import mongoose from 'mongoose';
import { connectDB } from '@/database/config/apiConnector';
import { ReactionType } from '@/types/types';
import Reaction from '@/database/models/Reaction';

interface Reactions {
  [key: string]: {
    count: number;
    deviceReactions: {
      [deviceId: string]: boolean;
    };
  };
}

export class ReactionService {
  private static instance: ReactionService;
  private Reaction: typeof Reaction;

  private constructor() {
    this.Reaction = Reaction;
  }

  public static getInstance(): ReactionService {
    if (!ReactionService.instance) {
      ReactionService.instance = new ReactionService();
    }
    return ReactionService.instance;
  }

  public async getReactionsForAnnouncement(announcementId: string): Promise<Reactions> {
    if (!this.Reaction) {
      await connectDB();
    }

    const reactions = await this.Reaction.find({ announcementId });
    
    // Initialisiere das Ergebnis-Objekt mit allen möglichen Reaktionstypen
    const result: Reactions = {
      thumbsUp: { count: 0, deviceReactions: {} },
      clap: { count: 0, deviceReactions: {} },
      laugh: { count: 0, deviceReactions: {} },
      surprised: { count: 0, deviceReactions: {} },
      heart: { count: 0, deviceReactions: {} }
    };

    // Fülle das Ergebnis-Objekt
    reactions.forEach(reaction => {
      if (reaction.type in result) {
        result[reaction.type].count++;
        result[reaction.type].deviceReactions[reaction.deviceId] = true;
      }
    });

    return result;
  }

  public async addReaction(announcementId: string, type: ReactionType, deviceId: string): Promise<void> {
    if (!this.Reaction) {
      await connectDB();
    }

    try {
      // Prüfe, ob bereits eine Reaktion dieses Typs existiert
      const existingReaction = await this.Reaction.findOne({ 
        announcementId, 
        deviceId, 
        type 
      });

      if (existingReaction) {
        // Wenn die gleiche Reaktion existiert, lösche sie (Toggle-Verhalten)
        await this.Reaction.deleteOne({ 
          announcementId, 
          deviceId, 
          type 
        });
        return;
      }

      // Wenn eine andere Reaktion existiert, lösche sie zuerst
      await this.Reaction.deleteMany({ 
        announcementId, 
        deviceId 
      });

      // Erstelle die neue Reaktion
      await this.Reaction.create({
        announcementId,
        type,
        deviceId
      });
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Reaktion:', error);
      throw error;
    }
  }

  public async removeReaction(announcementId: string, type: ReactionType, deviceId: string): Promise<void> {
    if (!this.Reaction) {
      await connectDB();
    }

    await this.Reaction.deleteOne({ announcementId, type, deviceId });
  }

  public async getDeviceReactions(announcementId: string, deviceId: string): Promise<ReactionType[]> {
    if (!this.Reaction) {
      await connectDB();
    }

    const reactions = await this.Reaction.find({ announcementId, deviceId });
    return reactions.map(r => r.type);
  }
} 