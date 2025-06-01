"use server";

import { createEvent as createEventService } from '../services/eventService';
import { Types } from 'mongoose';

// Helper function to convert ObjectIds to strings recursively
function deepObjectIdToString(obj: any): any {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(deepObjectIdToString);
  }
  if (typeof obj === 'object' && obj.constructor === Object) {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = deepObjectIdToString(obj[key]);
    }
    return newObj;
  }
  if (obj instanceof Types.ObjectId || (obj && obj._bsontype === 'ObjectId')) {
    return obj.toString();
  }
  return obj;
}

export async function createEventAction(data: Record<string, any>) {
  try {
    // Determine if this is an admin-created event
    const isAdminEvent = data.submittedByAdmin === true;
    
    // Ensure all required fields are present with proper logic
    const eventData = {
      ...data,
      submittedAt: new Date(), // Add the required submittedAt field
      status: isAdminEvent ? 'approved' : 'pending', // Admin events are approved, user events are pending
      submittedByAdmin: isAdminEvent, // Use the provided value or default to false
      // Ensure ObjectIds are properly converted
      dayId: typeof data.dayId === 'string' ? new Types.ObjectId(data.dayId) : data.dayId,
      categoryId: typeof data.categoryId === 'string' ? new Types.ObjectId(data.categoryId) : data.categoryId,
    };
    
    const event = await createEventService(eventData);
    
    // Serialize ObjectIds to strings for Client Components
    const serializedEvent = deepObjectIdToString(event);
    
    return { success: true, event: serializedEvent };
  } catch (error: any) {
    console.error('[createEventAction] Fehler:', error);
    return { success: false, error: error.message || 'Fehler beim Erstellen des Events' };
  }
} 