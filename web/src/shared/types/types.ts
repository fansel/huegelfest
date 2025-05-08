export type ReactionType = 'thumbsUp' | 'clap' | 'laugh' | 'surprised' | 'heart';

export type GroupColors = Record<string, string>;

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  thumbsUp: '👍',
  clap: '👏',
  laugh: '😂',
  surprised: '😮',
  heart: '❤️',
};

export interface IAnnouncement {
  id: string;
  content: string;
  date: string;
  time: string;
  groupId: string;
  groupName: string;
  groupColor: string;
  important: boolean;
  reactions: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
} 