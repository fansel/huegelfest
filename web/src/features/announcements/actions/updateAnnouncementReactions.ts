"use server";

import { updateAnnouncementReaction } from '../services/announcementService';
import { broadcast } from '@/lib/websocket/broadcast';
import { ReactionType } from '@/shared/types/types';

export async function updateAnnouncementReactionsAction(
  announcementId: string,
  reactionType: ReactionType
) {
  // Update in DB - Service verwendet nun Session-basierte Auth
  const result = await updateAnnouncementReaction(announcementId, reactionType);
  
  return result;
} 