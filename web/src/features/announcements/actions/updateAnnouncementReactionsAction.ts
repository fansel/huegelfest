import { updateAnnouncementReaction } from '../services/announcementService';
import { broadcast } from '@/lib/websocket/broadcast';
import { ReactionType } from '@/shared/types/types';

export async function updateAnnouncementReactionsAction(
  announcementId: string,
  reactionType: ReactionType,
  deviceId: string
) {
  // Update in DB
  const result = await updateAnnouncementReaction(announcementId, reactionType, deviceId);
  // WebSocket-Broadcast für alle Clients
  await broadcast('announcement-reaction-updated', { announcementId });
  return result;
} 