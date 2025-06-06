'use server';

import { createActivity } from '../services/activityService';
import { verifySession } from '@/features/auth/actions/userAuth';
import type { CreateActivityData } from '../types';

export async function createActivityAction(data: CreateActivityData) {
  // Session validieren und userId extrahieren
  const sessionData = await verifySession();
  if (!sessionData) {
    return { success: false, error: 'Nicht authentifiziert' };
  }

  try {
    const result = await createActivity(data, sessionData.userId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating activity:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Erstellen der Aktivität' 
    };
  }
} 