import { connectDB } from '@/lib/db/connector';
import { Timeline } from '@/lib/db/models/Timeline';
import type { TimelineData } from '../types/types';

export interface TimelineDay {
  _id?: string;
  title: string;
  description: string;
  date: string;
  events: TimelineEvent[];
}

export interface TimelineEvent {
  _id?: string;
  time: string;
  title: string;
  description: string;
  categoryId: string;
}

function cleanTimelineData(timeline: any): TimelineData | null {
  if (!timeline) return null;
  return {
    days: timeline.days.map((day: any) => ({
      _id: day._id,
      title: day.title,
      description: day.description,
      date: day.date,
      events: day.events.map((event: any) => ({
        _id: event._id,
        time: event.time,
        title: event.title,
        description: event.description,
        categoryId: event.categoryId
      }))
    }))
  };
}

export async function getTimeline(): Promise<TimelineData | null> {
  await connectDB();
  const timeline = await Timeline.findOne().sort({ createdAt: -1 }).lean();
  return cleanTimelineData(timeline);
}

export async function updateTimeline(data: TimelineData): Promise<TimelineData | null> {
  await connectDB();
  let timeline = await Timeline.findOne().sort({ createdAt: -1 });
  if (timeline) {
    timeline.days = data.days;
    await timeline.save();
  } else {
    timeline = await Timeline.create(data);
  }
  return cleanTimelineData(timeline);
}

export async function deleteTimeline(id: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const timeline = await Timeline.findByIdAndDelete(id);
  if (!timeline) {
    return { success: false, error: 'Timeline nicht gefunden' };
  }
  return { success: true };
} 