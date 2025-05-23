import { webPushService } from './webpush/webPushService';

export async function initWebpush() {
  await webPushService.initialize();
}

