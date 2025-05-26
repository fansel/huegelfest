'use server';
import { removeGlobalPacklistItem } from '../services/PacklistService';
import { broadcast } from '@/lib/websocket/broadcast';
import { webPushService } from '@/lib/webpush/webPushService';
import { initServices } from '@/lib/initServices';

export async function removePacklistItemAction(index: number) {
  await initServices();
  const removedItem = await removeGlobalPacklistItem(index);
  
  // WebSocket-Broadcast für Live-Updates
  await broadcast('packlist-updated', { action: 'remove', index });
  
  // Push-Notification an alle User senden (falls Item-Text verfügbar)
  if (webPushService.isInitialized() && removedItem) {
    await webPushService.sendNotificationToAll({
      title: 'Packliste aktualisiert 📦',
      body: `"${removedItem}" wurde von der Packliste entfernt`,
      icon: '/icon-192x192.png',
      badge: '/badge-96x96.png',
      data: {
        type: 'packlist',
        action: 'item-removed',
        itemText: removedItem,
        timestamp: new Date().toISOString()
      }
    });
  }
} 