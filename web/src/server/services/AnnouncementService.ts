import { connectDB } from '@/database/config/apiConnector';
import Announcement from '@/database/models/Announcement';
import Group from '@/database/models/Group';
import { logger } from '@/server/lib/logger';
import { webPushService } from '@/server/lib/webpush';
import { sseService } from '@/server/lib/sse';
import { IAnnouncement, IAnnouncementCreate } from '@/types/announcement';
import { ReactionService } from './ReactionService';
import mongoose from 'mongoose';

interface GroupInfo {
  id: string;
  name: string;
  color: string;
}

interface RateLimitInfo {
  count: number;
  lastReset: number;
}

export class AnnouncementService {
  private static instance: AnnouncementService;
  private reactionService: ReactionService;
  private groupCache: Map<string, GroupInfo>;
  private pushNotificationRateLimit: RateLimitInfo;
  private readonly PUSH_RATE_LIMIT = 10; // Max 10 Benachrichtigungen
  private readonly PUSH_RATE_WINDOW = 60000; // Pro Minute

  private constructor() {
    this.reactionService = ReactionService.getInstance();
    this.groupCache = new Map();
    this.pushNotificationRateLimit = {
      count: 0,
      lastReset: Date.now()
    };
  }

  public static getInstance(): AnnouncementService {
    if (!AnnouncementService.instance) {
      AnnouncementService.instance = new AnnouncementService();
    }
    return AnnouncementService.instance;
  }

  private async measureOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await operation();
    } finally {
      const duration = performance.now() - start;
      logger.info(`Operation ${name} dauerte ${duration.toFixed(2)}ms`);
    }
  }

  private isRateLimited(): boolean {
    const now = Date.now();
    if (now - this.pushNotificationRateLimit.lastReset > this.PUSH_RATE_WINDOW) {
      this.pushNotificationRateLimit = {
        count: 0,
        lastReset: now
      };
    }
    return this.pushNotificationRateLimit.count >= this.PUSH_RATE_LIMIT;
  }

  private async findGroupByName(groupName: string): Promise<GroupInfo | null> {
    return this.measureOperation('findGroupByName', async () => {
      if (!Group) {
        await connectDB();
      }

      try {
        const group = await Group.findOne({ name: groupName });
        if (!group) {
          return null;
        }
        const groupInfo = {
          id: group._id.toString(),
          name: group.name,
          color: group.color
        };
        this.groupCache.set(groupName, groupInfo);
        return groupInfo;
      } catch (error) {
        logger.error('[AnnouncementService] Fehler beim Suchen der Gruppe:', error);
        return null;
      }
    });
  }

  public async validateGroup(groupId: string): Promise<boolean> {
    return this.measureOperation('validateGroup', async () => {
      if (!Group) {
        await connectDB();
      }

      try {
        // Versuche zuerst, die Gruppe anhand des Namens zu finden
        const groupByName = await this.findGroupByName(groupId);
        if (groupByName) {
          return true;
        }

        // Wenn das nicht klappt, versuche es als ID
        const group = await Group.findById(groupId);
        return !!group;
      } catch (error) {
        logger.error('[AnnouncementService] Fehler bei der Gruppenvalidierung:', error);
        return false;
      }
    });
  }

  private async getGroupInfo(groupId: string): Promise<GroupInfo> {
    return this.measureOperation('getGroupInfo', async () => {
      if (!Group) {
        await connectDB();
      }

      // Prüfe Cache
      if (this.groupCache.has(groupId)) {
        return this.groupCache.get(groupId)!;
      }

      // Versuche zuerst, die Gruppe anhand des Namens zu finden
      const groupByName = await this.findGroupByName(groupId);
      if (groupByName) {
        return groupByName;
      }

      // Wenn das nicht klappt, versuche es als ID
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error(`Gruppe mit ID oder Namen "${groupId}" nicht gefunden`);
      }

      const groupInfo = {
        id: group._id.toString(),
        name: group.name,
        color: group.color
      };
      this.groupCache.set(groupId, groupInfo);
      return groupInfo;
    });
  }

  private async transformAnnouncement(announcement: any): Promise<IAnnouncement> {
    return this.measureOperation('transformAnnouncement', async () => {
      const groupInfo = await this.getGroupInfo(announcement.groupId.toString());
      const reactions = await this.reactionService.getReactionsForAnnouncement(announcement._id.toString());
      
      return {
        id: announcement._id.toString(),
        content: announcement.content,
        groupId: groupInfo.id,
        groupName: groupInfo.name,
        groupColor: groupInfo.color,
        important: announcement.important,
        reactions,
        createdAt: announcement.createdAt,
        updatedAt: announcement.updatedAt
      };
    });
  }

  private async notifyClients(): Promise<void> {
    try {
      logger.info('[AnnouncementService] Sende SSE-Update an Clients');
      sseService.sendUpdateToAllClients();
    } catch (error) {
      logger.error('[AnnouncementService] Fehler beim Senden des SSE-Updates:', error);
      // Fehler beim SSE-Update sollte die Operation nicht beeinflussen
    }
  }

  public async createAnnouncements(announcements: IAnnouncement[]): Promise<void> {
    return this.measureOperation('createAnnouncements', async () => {
      if (!Announcement) {
        await connectDB();
      }

      try {
        // Validiere alle Gruppen und hole ihre IDs
        const validatedAnnouncements = await Promise.all(announcements.map(async announcement => {
          const groupInfo = await this.getGroupInfo(announcement.groupId);
          if (!groupInfo) {
            throw new Error(`Ungültige Gruppe: ${announcement.groupId}`);
          }
          return {
            ...announcement,
            groupId: groupInfo.id
          };
        }));

        // Verarbeite jede Ankündigung
        for (const announcement of validatedAnnouncements) {
          let groupId;
          try {
            groupId = new mongoose.Types.ObjectId(announcement.groupId);
          } catch (error) {
            throw new Error(`Ungültige Gruppen-ID: ${announcement.groupId}`);
          }

          // Wenn eine ID vorhanden ist, prüfe ob die Ankündigung existiert
          if (announcement.id) {
            try {
              const announcementId = new mongoose.Types.ObjectId(announcement.id);
              const existingAnnouncement = await Announcement.findById(announcementId);
              
              if (existingAnnouncement) {
                // Update existierende Ankündigung
                await Announcement.findByIdAndUpdate(
                  announcementId,
                  {
                    content: announcement.content,
                    groupId,
                    important: announcement.important,
                    updatedAt: new Date()
                  },
                  { new: true }
                );
                logger.info(`[AnnouncementService] Ankündigung ${announcement.id} aktualisiert`);
                continue;
              }
            } catch (error) {
              logger.warn(`[AnnouncementService] Ungültige ID ${announcement.id}, erstelle neue Ankündigung`);
            }
          }

          // Erstelle neue Ankündigung
          const newAnnouncement = new Announcement({
            content: announcement.content,
            groupId,
            important: announcement.important || false,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          await newAnnouncement.save();
          logger.info('[AnnouncementService] Neue Ankündigung erstellt');
        }

        // Benachrichtige Clients über SSE
        await this.notifyClients();

        // Sende Push-Benachrichtigung für die erste Ankündigung
        if (announcements.length > 0) {
          const groupInfo = await this.getGroupInfo(announcements[0].groupId);
          await this.sendPushNotification(groupInfo.name, announcements[0].content);
        }
      } catch (error) {
        logger.error('[AnnouncementService] Fehler beim Erstellen/Aktualisieren der Ankündigungen:', error);
        throw error;
      }
    });
  }

  public async getAllAnnouncements(): Promise<IAnnouncement[]> {
    return this.measureOperation('getAllAnnouncements', async () => {
      if (!Announcement) {
        await connectDB();
      }

      try {
        const announcements = await Announcement.find()
          .sort({ createdAt: -1 })
          .lean();

        return Promise.all(announcements.map(announcement => this.transformAnnouncement(announcement)));
      } catch (error) {
        logger.error('[AnnouncementService] Fehler beim Laden der Ankündigungen:', error);
        throw error;
      }
    });
  }

  public async updateAnnouncements(announcements: IAnnouncement[]): Promise<void> {
    return this.measureOperation('updateAnnouncements', async () => {
      if (!Announcement) {
        await connectDB();
      }

      try {
        for (const announcement of announcements) {
          const groupInfo = await this.getGroupInfo(announcement.groupId);
          if (!groupInfo) {
            throw new Error(`Ungültige Gruppe: ${announcement.groupId}`);
          }

          let groupId;
          try {
            groupId = new mongoose.Types.ObjectId(groupInfo.id);
          } catch (error) {
            throw new Error(`Ungültige Gruppen-ID: ${groupInfo.id}`);
          }

          let announcementId;
          try {
            // Verwende die id als _id für MongoDB
            announcementId = new mongoose.Types.ObjectId(announcement.id);
          } catch (error) {
            throw new Error(`Ungültige Ankündigungs-ID: ${announcement.id}`);
          }

          const result = await Announcement.findByIdAndUpdate(
            announcementId,
            {
              content: announcement.content,
              groupId,
              important: announcement.important,
              updatedAt: new Date()
            },
            { new: true }
          );

          if (!result) {
            throw new Error(`Ankündigung mit ID ${announcement.id} nicht gefunden`);
          }
        }

        logger.info('[AnnouncementService] Ankündigungen erfolgreich aktualisiert');

        // Benachrichtige Clients über SSE
        await this.notifyClients();
      } catch (error) {
        logger.error('[AnnouncementService] Fehler beim Aktualisieren der Ankündigungen:', error);
        throw error;
      }
    });
  }

  public async deleteAnnouncements(ids: string[]): Promise<void> {
    return this.measureOperation('deleteAnnouncements', async () => {
      if (!Announcement) {
        await connectDB();
      }

      try {
        // Konvertiere die IDs in MongoDB ObjectIds und filtere ungültige IDs
        const validObjectIds: mongoose.Types.ObjectId[] = [];
        const invalidIds: string[] = [];

        for (const id of ids) {
          try {
            validObjectIds.push(new mongoose.Types.ObjectId(id));
          } catch (error) {
            invalidIds.push(id);
            logger.warn(`[AnnouncementService] Ungültige ID gefunden: ${id}`);
          }
        }

        if (invalidIds.length > 0) {
          logger.warn(`[AnnouncementService] ${invalidIds.length} ungültige IDs gefunden: ${invalidIds.join(', ')}`);
        }

        if (validObjectIds.length === 0) {
          throw new Error('Keine gültigen IDs zum Löschen gefunden');
        }

        // Prüfe zuerst, ob die Ankündigungen existieren
        const existingAnnouncements = await Announcement.find({ _id: { $in: validObjectIds } });
        if (existingAnnouncements.length === 0) {
          throw new Error('Keine Ankündigungen mit den angegebenen IDs gefunden');
        }

        // Versuche die Ankündigungen zu löschen
        const result = await Announcement.deleteMany({ _id: { $in: validObjectIds } });
        
        // Überprüfe das Ergebnis
        if (result.deletedCount === 0) {
          throw new Error('Keine Ankündigungen konnten gelöscht werden');
        }

        if (result.deletedCount < validObjectIds.length) {
          logger.warn(`[AnnouncementService] Nur ${result.deletedCount} von ${validObjectIds.length} Ankündigungen wurden gelöscht`);
        }

        logger.info(`[AnnouncementService] ${result.deletedCount} Ankündigungen erfolgreich gelöscht`);

        // Benachrichtige Clients über SSE
        await this.notifyClients();
      } catch (error) {
        logger.error('[AnnouncementService] Fehler beim Löschen der Ankündigungen:', error);
        throw error;
      }
    });
  }

  private async sendPushNotification(groupName: string, content: string): Promise<void> {
    return this.measureOperation('sendPushNotification', async () => {
      try {
        if (this.isRateLimited()) {
          logger.warn('[AnnouncementService] Rate limit für Push-Benachrichtigungen erreicht');
          return;
        }

        if (webPushService.isInitialized()) {
          const notificationData = {
            title: `${groupName} schrieb:`,
            body: content,
            icon: '/icon-192x192.png',
            badge: '/badge-96x96.png',
            data: {
              url: '/',
              timestamp: new Date().toISOString()
            }
          };

          await webPushService.sendNotificationToAll(notificationData);
          this.pushNotificationRateLimit.count++;
          logger.info('Push-Benachrichtigung erfolgreich gesendet', { groupName });
        }
      } catch (error) {
        logger.error('Fehler beim Senden der Push-Benachrichtigung:', {
          error: error instanceof Error ? error.message : 'Unbekannter Fehler',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    });
  }

  public async getAnnouncementById(id: string): Promise<IAnnouncement | null> {
    return this.measureOperation('getAnnouncementById', async () => {
      if (!Announcement) {
        await connectDB();
      }

      try {
        let announcementId;
        try {
          announcementId = new mongoose.Types.ObjectId(id);
        } catch (error) {
          throw new Error(`Ungültige Ankündigungs-ID: ${id}`);
        }

        const announcement = await Announcement.findById(announcementId).lean();
        if (!announcement) {
          return null;
        }

        return this.transformAnnouncement(announcement);
      } catch (error) {
        logger.error('[AnnouncementService] Fehler beim Laden der Ankündigung:', error);
        throw error;
      }
    });
  }
} 