import { ReactionType } from '@/database/models/Reaction';

// Basis-Interface für Datenbank-Operationen
export interface IAnnouncementBase {
  content: string;
  date?: string;
  time?: string;
  groupId: string;
  important?: boolean;
}

// Interface für Frontend-Anzeige
export interface IAnnouncement extends IAnnouncementBase {
  id: string;
  groupName: string;
  groupColor: string;
  reactions: {
    [key in ReactionType]: {
      count: number;
      deviceReactions: Record<string, boolean>;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Interface für Datenbank-Operationen
export interface IAnnouncementCreate extends IAnnouncementBase {
  id?: string;  // Optional ID für Updates
  createdAt: Date;
  updatedAt: Date;
}

// Interface für Reaction-Operationen
export interface IReaction {
  id: string;
  announcementId: string;
  deviceId: string;
  type: ReactionType;
  createdAt: Date;
  updatedAt: Date;
} 