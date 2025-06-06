# WebSocket-Echtzeit-Integration

## WebSocket-Server starten

Der WebSocket-Server befindet sich unter `src/lib/websocket/server.ts` und kann mit Node.js gestartet werden:

```bash
cd web
npx ts-node src/lib/websocket/server.ts
```

Der Server läuft standardmäßig auf `ws://localhost:8080` (Port kann über die Umgebungsvariable `WEBSOCKET_PORT` angepasst werden).

## Nutzung im Client

Verwende den Hook `useGlobalWebSocket` aus `src/shared/hooks/useGlobalWebSocket.ts`:

```tsx
'use client';
import { useState } from 'react';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';
import type { WebSocketMessage } from '@/shared/hooks/useGlobalWebSocket';

export default function AnnouncementList() {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useGlobalWebSocket({
    onMessage: (msg: WebSocketMessage) => {
      if (msg.topic === 'announcement') {
        setAnnouncements((prev) => [msg.payload, ...prev]);
      }
    },
    // Optional: Filter für spezifische Topics
    topicFilter: ['announcement']
  });

  // ... Render-Logik
}
```

## Typen

Die Typen für Nachrichten und Topics findest du in `src/shared/hooks/useGlobalWebSocket.ts`.

---

**Hinweis:**
- Der Server ist aktuell offen für alle (keine Authentifizierung).
- Für produktive Nutzung sollte der Server als separater Prozess laufen (z.B. per PM2, Docker, etc.). 