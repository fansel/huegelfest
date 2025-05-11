import { useEffect, useState } from 'react';
import { fetchTimeline } from '@/features/timeline/actions/fetchTimeline';

interface TimelineData {
  days: { title: string }[];
}

function isTimelineData(obj: any): obj is TimelineData {
  return obj && Array.isArray(obj.days);
}

export function useTimelineDays(): string[] {
  const [days, setDays] = useState<string[]>([]);
  useEffect(() => {
    fetchTimeline().then(data => {
      if (isTimelineData(data)) {
        setDays(data.days.map((day) => day.title));
      }
    });
  }, []);
  return days;
} 