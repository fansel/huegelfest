"use server";

import { getTimeline } from '../services/timelineService';

export async function getTimelineAction() {
  return await getTimeline();
} 