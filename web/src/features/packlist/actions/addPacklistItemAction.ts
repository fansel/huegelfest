'use server';
import { addGlobalPacklistItem } from '../services/PacklistService';
import { broadcast } from '@/lib/websocket/broadcast';
import { createScheduledPushEvent } from '@/features/pushScheduler/scheduledPushEventService';
import { initServices } from '@/lib/initServices';

export async function addPacklistItemAction(text: string) {
  await initServices();
  await addGlobalPacklistItem(text);
  
  // WebSocket-Broadcast für Live-Updates
  await broadcast('packlist-updated', { action: 'add', text });
  
  // Schedule a push notification
  await createScheduledPushEvent({
    title: 'Packliste aktualisiert 📦',
    body: `"${text}" wurde auf die Packliste gesetzt`,
    repeat: 'once',
    schedule: new Date(),
    active: true,
    sendToAll: true,
    type: 'general',
    data: {
      type: 'packlist',
      action: 'item-added',
      itemText: text,
      timestamp: new Date().toISOString()
    }
  });
} 