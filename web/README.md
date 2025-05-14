# WebSocket-Echtzeit-Integration

## WebSocket-Server starten

Der WebSocket-Server befindet sich unter `src/lib/websocket/server.ts` und kann mit Node.js gestartet werden:

```bash
cd web
npx ts-node src/lib/websocket/server.ts
```

Der Server läuft standardmäßig auf `ws://localhost:8080` (Port kann über die Umgebungsvariable `WEBSOCKET_PORT` angepasst werden).

## Nutzung im Client

Verwende den Hook `useWebSocket` aus `src/shared/hooks/useWebSocket.ts`:

```tsx
'use client';
import { useState } from 'react';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import type { WebSocketMessage } from '@/shared/types/websocket';

export default function AnnouncementList() {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useWebSocket('ws://localhost:8080', {
    onMessage: (msg: WebSocketMessage) => {
      if (msg.topic === 'announcement') {
        setAnnouncements((prev) => [msg.payload, ...prev]);
      }
    },
  });

  // ... Render-Logik
}
```

## Typen

Die Typen für Nachrichten und Topics findest du in `src/shared/types/websocket.ts`.

---

**Hinweis:**
- Der Server ist aktuell offen für alle (keine Authentifizierung).
- Für produktive Nutzung sollte der Server als separater Prozess laufen (z.B. per PM2, Docker, etc.). 