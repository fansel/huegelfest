"use server";

import { getCategoriesAction } from '@/features/categories/actions/getCategories';
import { fetchApprovedEventsByDay } from './fetchApprovedEventsByDay';
import { getCentralFestivalDaysAction } from '@/shared/actions/festivalDaysActions';
import { getAllTimelineCustomTitles } from '../services/timelineCustomTitleService';

/**
 * Aggregiert alle Daten für die Timeline: Central Festival Days, Kategorien, Events, Custom Titles
 * Now includes timeline-specific custom titles that override central festival day labels
 */
export async function fetchTimeline() {
  const centralDaysResult = await getCentralFestivalDaysAction();
  const categories = await getCategoriesAction();
  const customTitles = await getAllTimelineCustomTitles();
  
  // Handle the response structure from central festival days
  const centralDays = centralDaysResult.success ? centralDaysResult.days : [];
  
  // Convert central festival days to timeline format and load events
  const days = await Promise.all(
    centralDays
      .filter((day: any) => day.isActive !== false) // Only show active days in user timeline
      .map(async (day: any) => {
        const events = await fetchApprovedEventsByDay(day._id!);
        const customTitle = customTitles[day._id!];
        
        return { 
          _id: day._id,
          title: customTitle || day.label, // Use custom title if available, otherwise fall back to central label
          timelineCustomTitle: customTitle, // Store the custom title separately for editing
          description: day.description || '',
          date: day.date,
          events,
          isActive: day.isActive
        };
    })
  );
  
  return { days, categories };
} 