// Lazy Loading Service für Edge-Runtime-sichere Services
import type { SSEService } from './sse';
import type { WebPushService } from './webpush';

interface LazyService<T> {
  getInstance(): Promise<T>;
}

class LazyServiceManager {
  private static instance: LazyServiceManager;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): LazyServiceManager {
    if (!LazyServiceManager.instance) {
      LazyServiceManager.instance = new LazyServiceManager();
    }
    return LazyServiceManager.instance;
  }

  async getService<T>(serviceName: string, importPath: string): Promise<T> {
    if (!this.services.has(serviceName)) {
      try {
        const module = await import(importPath);
        if (!module[serviceName]) {
          throw new Error(`Service ${serviceName} nicht in ${importPath} gefunden`);
        }
        this.services.set(serviceName, module[serviceName]);
      } catch (error) {
        console.error(`Fehler beim Laden von ${serviceName}:`, error);
        throw error;
      }
    }
    return this.services.get(serviceName);
  }
}

// WebPush Service
export const webPushService: LazyService<WebPushService> = {
  async getInstance() {
    return LazyServiceManager.getInstance().getService<WebPushService>('webPushService', '@/server/lib/webpush');
  }
};

// SSE Service - nur für Edge-Runtime verwenden
export const sseService: LazyService<SSEService> = {
  async getInstance() {
    return LazyServiceManager.getInstance().getService<SSEService>('sseService', '@/server/lib/sse');
  }
};

// Weitere Services können hier hinzugefügt werden 