"use server";

import { updateAnnouncementReaction } from '../services/announcementService';
import { ReactionType } from '@/shared/types/types';

export async function updateAnnouncementReactionsAction(
  announcementId: string,
  reactionType: ReactionType,
  deviceId: string
) {
  return await updateAnnouncementReaction(announcementId, reactionType, deviceId);
} 