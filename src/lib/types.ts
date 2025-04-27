export interface Announcement {
  id: number;
  content: string;
  date: string;
  time: string;
  author: string;
  group: string;
  important: boolean;
  reactions: {
    [key: string]: {
      count: number;
      deviceReactions: {
        [deviceId: string]: {
          type: string;
          announcementId: number;
        };
      };
    };
  };
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
  category: 'music' | 'workshop' | 'food' | 'camp' | 'game' | 'other';
}

export interface Day {
  title: string;
  description: string;
  events: Event[];
}

export interface TimelineData {
  days: Day[];
} 