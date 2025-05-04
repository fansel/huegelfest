// Lazy Loading Service für Edge-Runtime-sichere Services
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
      const module = await import(importPath);
      this.services.set(serviceName, module[serviceName]);
    }
    return this.services.get(serviceName);
  }
}

// WebPush Service
export const webPushService: LazyService<any> = {
  async getInstance() {
    return LazyServiceManager.getInstance().getService('webPushService', '@/server/lib/webpush');
  }
};

// SSE Service
export const sseService: LazyService<any> = {
  async getInstance() {
    return LazyServiceManager.getInstance().getService('sseService', '@/server/lib/sse');
  }
};

// Weitere Services können hier hinzugefügt werden 