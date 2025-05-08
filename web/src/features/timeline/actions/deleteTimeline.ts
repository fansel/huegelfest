"use server";

import { deleteTimeline } from '../services/timelineService';

export async function deleteTimelineAction(id: string) {
  return await deleteTimeline(id);
} 