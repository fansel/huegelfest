'use server';
import { addGlobalPacklistItem } from '../services/PacklistService';
import { broadcast } from '@/lib/websocket/broadcast';
import { webPushService } from '@/lib/webpush/webPushService';
import { initServices } from '@/lib/initServices';

export async function addPacklistItemAction(text: string) {
  await initServices();
  await addGlobalPacklistItem(text);
  
  // WebSocket-Broadcast für Live-Updates
  await broadcast('packlist-updated', { action: 'add', text });
  
  // Push-Notification an alle User senden
  if (webPushService.isInitialized()) {
    await webPushService.sendNotificationToAll({
      title: 'Packliste aktualisiert 📦',
      body: `"${text}" wurde auf die Packliste gesetzt`,
      icon: '/icon-192x192.png',
      badge: '/badge-96x96.png',
      data: {
        type: 'packlist',
        action: 'item-added',
        itemText: text,
        timestamp: new Date().toISOString()
      }
    });
  }
} 