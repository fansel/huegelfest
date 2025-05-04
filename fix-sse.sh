#!/bin/bash

# Farben für die Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starte SSE-Implementierung Überarbeitung...${NC}"

# 1. Korrigiere lazyServices.ts
echo -e "${YELLOW}1. Korrigiere lazyServices.ts...${NC}"
cat > web/src/server/lib/lazyServices.ts << 'EOL'
// Services für Edge-Runtime-sichere Implementierungen
import { sseService, removeClient, sendUpdateToAllClients } from './sse';
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

// WebPush Service (bleibt lazy wegen Edge-Runtime)
export const webPushService: LazyService<WebPushService> = {
  async getInstance() {
    return LazyServiceManager.getInstance().getService<WebPushService>('webPushService', '@/server/lib/webpush');
  }
};

// SSE Service - direkter Export ohne Lazy Loading
export { sseService, removeClient, sendUpdateToAllClients };
EOL

# 2. Korrigiere updates/route.ts
echo -e "${YELLOW}2. Korrigiere updates/route.ts...${NC}"
cat > web/src/app/api/updates/route.ts << 'EOL'
import { NextRequest } from 'next/server';
import { sseService } from '@/server/lib/lazyServices';
import { logger } from '@/server/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  logger.info('Neue SSE-Verbindung wird hergestellt');
  
  try {
    return sseService.createResponse();
  } catch (error) {
    logger.error('Fehler beim Erstellen der SSE-Verbindung:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
EOL

# 3. Korrigiere groups/route.ts
echo -e "${YELLOW}3. Korrigiere groups/route.ts...${NC}"
sed -i '' 's/const sse = await sseService.getInstance();\n    sse\./sseService\./g' web/src/app/api/groups/route.ts

# 4. Korrigiere announcements/route.ts
echo -e "${YELLOW}4. Korrigiere announcements/route.ts...${NC}"
sed -i '' 's/const sse = await sseService.getInstance();\n    sse\./sseService\./g' web/src/app/api/announcements/route.ts

# 5. Korrigiere admin.ts
echo -e "${YELLOW}5. Korrigiere admin.ts...${NC}"
sed -i '' 's/const sse = await sseService.getInstance();\n    sse\./sseService\./g' web/src/server/actions/admin.ts

# 6. Überprüfe die Änderungen
echo -e "${YELLOW}6. Überprüfe die Änderungen...${NC}"
if grep -r "sseService.getInstance()" web/src; then
  echo -e "${RED}Warnung: Es wurden noch getInstance()-Aufrufe gefunden!${NC}"
else
  echo -e "${GREEN}Alle getInstance()-Aufrufe wurden erfolgreich entfernt.${NC}"
fi

# 7. Überprüfe die Imports
echo -e "${YELLOW}7. Überprüfe die Imports...${NC}"
if grep -r "from.*lazyServices" web/src; then
  echo -e "${GREEN}Imports wurden korrekt aktualisiert.${NC}"
else
  echo -e "${RED}Warnung: Keine Imports von lazyServices gefunden!${NC}"
fi

echo -e "${GREEN}SSE-Implementierung Überarbeitung abgeschlossen!${NC}" 