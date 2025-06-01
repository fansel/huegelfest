"use server";

import { connectDB } from '@/lib/db/connector';
import { cleanupPastPushEvents } from './scheduledPushEventService';

export async function cleanupPastEventsAction(): Promise<{ success: boolean; deleted?: number; cleaned?: number; error?: string }> {
  try {
    await connectDB();
    
    const result = await cleanupPastPushEvents();
    
    return { 
      success: true, 
      deleted: result.deleted, 
      cleaned: result.cleaned 
    };
  } catch (error: any) {
    console.error('[cleanupPastEventsAction] Error:', error);
    return { 
      success: false, 
      error: error.message || 'Fehler beim Bereinigen der vergangenen Events' 
    };
  }
} 