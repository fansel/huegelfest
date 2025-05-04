// Services für Edge-Runtime-sichere Implementierungen
import { webPushService as webPushServiceInstance } from './webpush';
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
        // Verwende einen statischen Import-Pfad
        const module = await import(/* webpackChunkName: "[request]" */ importPath);
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

// WebPush Service (bleibt lazy wegen Edge-Runtime)
export const webPushService: LazyService<WebPushService> = {
  async getInstance() {
    return webPushServiceInstance;
  }
};
