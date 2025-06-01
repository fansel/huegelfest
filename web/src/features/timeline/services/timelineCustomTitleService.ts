"use server";

import { connectDB } from '@/lib/db/connector';
import { TimelineCustomTitle } from '@/lib/db/models/TimelineCustomTitle';

export interface TimelineCustomTitleData {
  festivalDayId: string;
  customTitle: string;
}

/**
 * Holt alle Timeline Custom Titles
 */
export async function getAllTimelineCustomTitles(): Promise<Record<string, string>> {
  try {
    await connectDB();
    
    const customTitles = await TimelineCustomTitle.find().lean();
    
    // Convert to record for easy lookup
    const titleMap: Record<string, string> = {};
    customTitles.forEach(title => {
      titleMap[title.festivalDayId] = title.customTitle;
    });
    
    return titleMap;
  } catch (error) {
    console.error('[getAllTimelineCustomTitles] Fehler:', error);
    return {};
  }
}

/**
 * Setzt oder aktualisiert einen Timeline Custom Title
 */
export async function setTimelineCustomTitle(data: TimelineCustomTitleData): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    
    await TimelineCustomTitle.findOneAndUpdate(
      { festivalDayId: data.festivalDayId },
      { customTitle: data.customTitle },
      { upsert: true, new: true }
    );
    
    return { success: true };
  } catch (error: any) {
    console.error('[setTimelineCustomTitle] Fehler:', error);
    return { success: false, error: error.message || 'Fehler beim Speichern des Custom Titels' };
  }
}

/**
 * Löscht einen Timeline Custom Title
 */
export async function deleteTimelineCustomTitle(festivalDayId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    
    await TimelineCustomTitle.findOneAndDelete({ festivalDayId });
    
    return { success: true };
  } catch (error: any) {
    console.error('[deleteTimelineCustomTitle] Fehler:', error);
    return { success: false, error: error.message || 'Fehler beim Löschen des Custom Titels' };
  }
} 