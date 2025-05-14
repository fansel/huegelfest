"use server";

import { getAnnouncementReactions as getAnnouncementReactionsService } from '../services/announcementService';
import { ReactionType } from '@/shared/types/types';

export async function getAnnouncementReactionsAction(
  announcementId: string,
  deviceId?: string
): Promise<{ counts: Record<ReactionType, number>; userReaction?: ReactionType }> {
  return await getAnnouncementReactionsService(announcementId, deviceId);
} 