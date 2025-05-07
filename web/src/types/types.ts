export interface Announcement {
  _id: string;
  id: string;
  content: string;
  date: string;
  time: string;
  group: string;
  groupColor: string;
  important: boolean;
  reactions: {
    [key in ReactionType]: {
      count: number;
      deviceReactions: {
        [deviceId: string]: {
          type: ReactionType;
          announcementId: string;
        };
      };
    };
  };
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupInfo {
  id: string;
  name: string;
  color: string;
}

export interface GroupColors {
  [key: string]: string;  // key ist der Gruppenname, value ist die Farbe
}

export interface GroupColorSetting {
  group: string;
  color: string;
}

export const REACTION_EMOJIS = {
  thumbsUp: '👍',
  heart: '❤️',
  laugh: '😂',
  surprised: '😮',
  clap: '👏',
} as const;

export type ReactionType = keyof typeof REACTION_EMOJIS;

export type LoginCredentials = {
  username: string;
  password: string;
};

export interface Event {
  time: string;
  title: string;
  description: string;
  categoryId: string | { $oid: string };
  favorite?: boolean;
  _id?: { $oid: string };
}

export interface Day {
  title: string;
  description: string;
  date: Date | string;
  events: Event[];
  formattedDate?: string;
}

export interface TimelineData {
  days: Day[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
