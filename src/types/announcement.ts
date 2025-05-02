export interface IAnnouncement {
  id: string;
  content: string;
  date?: string;
  time?: string;
  group: string;
  groupColor: string;
  groupId?: string;
  important?: boolean;
  reactions?: {
    thumbsUp: { count: number; deviceReactions: Record<string, any> };
    clap: { count: number; deviceReactions: Record<string, any> };
    laugh: { count: number; deviceReactions: Record<string, any> };
    surprised: { count: number; deviceReactions: Record<string, any> };
    heart: { count: number; deviceReactions: Record<string, any> };
  };
  createdAt: Date;
  updatedAt: Date;
} 