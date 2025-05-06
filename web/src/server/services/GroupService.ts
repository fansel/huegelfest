import { connectDB } from '@/database/config/apiConnector';
import Group from '@/database/models/Group';
import { logger } from '@/server/lib/logger';

export class GroupService {
  private static instance: GroupService;

  private constructor() {}

  public static getInstance(): GroupService {
    if (!GroupService.instance) {
      GroupService.instance = new GroupService();
    }
    return GroupService.instance;
  }

  public async createGroup(name: string, color: string): Promise<void> {
    if (!Group) {
      await connectDB();
    }

    try {
      await Group.create({ name, color });
    } catch (error) {
      if (error.code === 11000) {
        throw new Error(`Eine Gruppe mit dem Namen "${name}" existiert bereits`);
      }
      throw error;
    }
  }

  public async updateGroup(id: string, updates: { name?: string; color?: string }): Promise<void> {
    if (!Group) {
      await connectDB();
    }

    try {
      const group = await Group.findByIdAndUpdate(id, updates, { new: true });
      if (!group) {
        throw new Error(`Gruppe mit ID ${id} nicht gefunden`);
      }
    } catch (error) {
      if (error.code === 11000) {
        throw new Error(`Eine Gruppe mit dem Namen "${updates.name}" existiert bereits`);
      }
      throw error;
    }
  }

  public async deleteGroup(id: string): Promise<void> {
    if (!Group) {
      await connectDB();
    }

    const result = await Group.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new Error(`Gruppe mit ID ${id} nicht gefunden`);
    }
  }

  public async getGroupColors(): Promise<Record<string, string>> {
    if (!Group) {
      await connectDB();
    }

    const groups = await Group.find().lean();
    return groups.reduce((acc, group) => {
      acc[group.name] = group.color;
      return acc;
    }, {} as Record<string, string>);
  }

  public async saveGroupColors(groups: Record<string, string>): Promise<void> {
    if (!Group) {
      await connectDB();
    }

    try {
      // Lösche alle bestehenden Gruppen
      await Group.deleteMany({});

      // Erstelle neue Gruppen
      const groupDocuments = Object.entries(groups).map(([name, color]) => ({
        name,
        color,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await Group.insertMany(groupDocuments);
      logger.info('[GroupService] Gruppenfarben erfolgreich gespeichert');
    } catch (error) {
      logger.error('[GroupService] Fehler beim Speichern der Gruppenfarben:', error);
      throw error;
    }
  }

  public async validateGroup(id: string): Promise<boolean> {
    if (!Group) {
      await connectDB();
    }

    const group = await Group.findById(id);
    return !!group;
  }
} 