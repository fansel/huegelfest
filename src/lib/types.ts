export interface Announcement {
  _id: string;
  id: string;
  content: string;
  date: string;
  time: string;
  author: string;
  group: string;
  groupColor: string;
  important: boolean;
  reactions: {
    [key: string]: {
      count: number;
      deviceReactions: {
        [deviceId: string]: {
          type: string;
          announcementId: string;
        };
      };
    };
  };
  title: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupColors {
  [key: string]: string;
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
  clap: '👏'
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
  categoryId: string;
  favorite?: boolean;
}

export interface Day {
  _id: string;
  title: string;
  description: string;
  date?: Date;
  events: Event[];
  formattedDate?: string;
}

export interface TimelineData {
  _id: string;
  days: Day[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
} 