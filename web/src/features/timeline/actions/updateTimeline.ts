"use server";

import { updateTimeline } from '../services/timelineService';
import type { TimelineData } from '../types/types';

export async function updateTimelineAction(data: TimelineData) {
  return await updateTimeline(data);
} 