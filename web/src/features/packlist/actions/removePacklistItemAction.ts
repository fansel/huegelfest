'use server';
import { removeGlobalPacklistItem } from '../services/PacklistService';
import { broadcast } from '@/lib/websocket/broadcast';
import { createScheduledPushEvent } from '@/features/pushScheduler/scheduledPushEventService';
import { initServices } from '@/lib/initServices';

export async function removePacklistItemAction(index: number) {
  await initServices();
  const removedItem = await removeGlobalPacklistItem(index);
  
  // WebSocket-Broadcast für Live-Updates
  await broadcast('packlist-updated', { action: 'remove', index });
  
  // Schedule a push notification if an item was actually removed
  if (removedItem) {
    await createScheduledPushEvent({
      title: 'Packliste aktualisiert 📦',
      body: `"${removedItem}" wurde von der Packliste entfernt`,
      repeat: 'once',
      schedule: new Date(),
      active: true,
      sendToAll: true,
      type: 'general',
      data: {
        type: 'packlist',
        action: 'item-removed',
        itemText: removedItem,
        timestamp: new Date().toISOString()
      }
    });
  }
} 