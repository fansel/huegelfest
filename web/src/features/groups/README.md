# Groups Feature - Server-Side Rendering Refactoring

## Übersicht

Das Groups-Feature wurde von Client-Side Rendering auf Server-Side Rendering umgestellt, um bessere Performance und SEO zu ermöglichen.

## Architektur

### Actions (Server Actions)
- `fetchGroupsData.ts` - Aggregiert alle Daten für das Groups-Management (ähnlich wie `fetchTimeline`)
- `groupActions.ts` - Individuelle Server Actions für CRUD-Operationen

### Komponenten

#### Server Components
- `GroupsOverviewServer.tsx` - Server Component, die initial Daten lädt
- `GroupsOverviewClient.tsx` - Client Component, die Server-Daten als Props erhält

#### Client Components  
- `GroupsOverviewUpdated.tsx` - Aktualisierte Version der ursprünglichen Komponente, nutzt `fetchGroupsData`
- `GroupsOverview.tsx` - Legacy-Komponente (für Rückwärtskompatibilität)

### Services
Die Services werden weiterhin von den Actions verwendet, aber nicht direkt von den Komponenten.

## Verwendung

### Für neue Implementierungen (empfohlen):
```tsx
import { GroupsOverviewUpdated } from '@/features/groups/components';

// In einer Client Component
<GroupsOverviewUpdated />
```

### Für echtes SSR (falls benötigt):
```tsx
import { GroupsOverviewServer } from '@/features/groups/components';

// In einer Server Component
<GroupsOverviewServer />
```

## Vorteile der neuen Architektur

1. **Server-Side Rendering**: Initiale Daten werden auf dem Server geladen
2. **Bessere Performance**: Weniger Client-Server Round-trips
3. **Typsicherheit**: Explizite TypeScript-Typen für alle Datenstrukturen
4. **Konsistenz**: Folgt dem gleichen Muster wie Timeline
5. **Wartbarkeit**: Klare Trennung zwischen Server- und Client-Logik

## Migration

Die alte `GroupsOverview` Komponente bleibt für Rückwärtskompatibilität erhalten. Neue Implementierungen sollten `GroupsOverviewUpdated` verwenden.

## Datenfluss

1. `fetchGroupsData` Action aggregiert alle benötigten Daten
2. Daten werden an Client Component weitergegeben
3. Client Component verwaltet lokalen State und UI-Interaktionen
4. Mutationen erfolgen über Server Actions 

## 🚀 Echtzeit-Synchronisation (WebSockets)

Das Groups Feature ist jetzt vollständig in das bestehende WebSocket-System integriert und bietet **Live-Updates** zwischen mehreren Admin-Sessions.

### Verwendung im AdminDashboard

Das AdminDashboard verwendet automatisch die WebSocket-basierte Komponente:

```tsx
// web/src/features/admin/dashboard/AdminDashboardClient.tsx
import { GroupsOverviewWebSocket } from '../../groups/components/GroupsOverviewWebSocket';

// Wird automatisch verwendet für 'groups' Tab
{activeTab === 'groups' && <GroupsOverviewWebSocket />}
```

### WebSocket Events

Folgende Events werden automatisch zwischen allen verbundenen Clients synchronisiert:

- **`group-created`** - Neue Gruppe erstellt
- **`group-updated`** - Gruppe aktualisiert  
- **`group-deleted`** - Gruppe gelöscht
- **`user-assigned`** - Benutzer einer Gruppe zugewiesen
- **`user-removed`** - Benutzer aus Gruppe entfernt
- **`groups-updated`** - Allgemeine Updates (z.B. Massen-Zuweisungen)
- **`registration-updated`** - Anmeldungs-Status geändert

### Gesperrte Gruppen (isAssignable: false)

Das System unterstützt **gesperrte Gruppen**, die nicht für automatische Zuweisungen verfügbar sind:

**Verhalten in der Benutzer-Übersicht:**
- 🔒 **Gesperrte Gruppen** werden mit `(gesperrt)` markiert und in orange dargestellt
- ✅ **Anzeige**: Benutzer in gesperrten Gruppen werden korrekt angezeigt  
- ❌ **Zuweisung**: Manuelle Zuweisung zu gesperrten Gruppen ist deaktiviert
- 🔄 **Entfernung**: Benutzer können aus gesperrten Gruppen entfernt werden

**Use Cases:**
- Spezielle Gruppen (Admin, Helfer, etc.)
- Temporäre Gruppen die nicht befüllt werden sollen
- Legacy-Gruppen die erhalten aber nicht erweitert werden sollen

### Connection Status

Die Komponente zeigt den WebSocket-Verbindungsstatus an:
- ✅ **"Live-Updates aktiv"** - WebSocket verbunden
- ❌ **"Verbindung getrennt"** - WebSocket getrennt, manueller Reload möglich

### Mehrbenutzerbetrieb

**Automatische Synchronisation zwischen Admin-Sessions:**

1. **Admin A** erstellt eine neue Gruppe
   → **Admin A** sieht Toast "Gruppe erstellt"
   → **Admin B** sieht die neue Gruppe sofort ohne Reload (kein Toast)

2. **Admin A** weist einen Benutzer einer Gruppe zu  
   → **Admin A** sieht Toast "Benutzer wurde zugewiesen"
   → **Admin B** sieht die Änderung in Echtzeit (kein Toast)

3. **Admin A** löscht eine Gruppe
   → **Admin A** sieht Toast "Gruppe gelöscht"
   → **Admin B** sieht das Update sofort (kein Toast)

4. **Admin A** ändert Anmeldungs-Status
   → **Admin A** sieht Toast "Bezahlt-Status aktualisiert"
   → **Admin B** sieht Status-Update live (kein Toast)

**Toast-Verhalten:**
- ✅ **Ausführender Admin**: Sieht Bestätigungs-Toast für eigene Aktionen
- 📡 **Andere Admins**: Erhalten nur Live-Daten-Updates ohne störende Toast-Messages
- 🔄 **Alle**: Sehen Datenänderungen in Echtzeit ohne manuellen Reload

## Architecture Patterns

### 1. WebSocket Real-time (Empfohlen für Admin)
- **Hook**: `useGroupsWebSocket()`
- **Component**: `GroupsOverviewWebSocket`
- **Features**: Live-Updates, Connection-Status, Toast-Benachrichtigungen
- **Verwendet**: Bestehende WebSocket-Infrastruktur (`useWebSocket`)

```tsx
import { useGroupsWebSocket } from '../hooks/useGroupsWebSocket';

const { data, loading, connected, refreshData } = useGroupsWebSocket();
```

### 2. Server Actions (SSR-optimiert)
- **Action**: `fetchGroupsData()`
- **Component**: `GroupsOverviewUpdated`
- **Features**: Server-side Datenabfrage, optimierte Performance

```tsx
import { fetchGroupsData } from '../actions/fetchGroupsData';

const groupsData = await fetchGroupsData();
```

### 3. Legacy (Client-side)
- **Component**: `GroupsOverview`
- **Features**: Client-side Datenabfrage über Services

## WebSocket Integration Details

### Hook Implementation

```tsx
// web/src/features/groups/hooks/useGroupsWebSocket.ts
export function useGroupsWebSocket() {
  const [data, setData] = useState<GroupsData>({/* ... */});
  const [connected, setConnected] = useState(false);

  // Verwendet bestehende WebSocket-Infrastruktur
  useWebSocket(getWebSocketUrl(), {
    onMessage: (msg: WebSocketMessage) => {
      if (msg.topic === 'group-created' || 
          msg.topic === 'group-updated' || 
          /* andere group events */) {
        refreshData(); // Lädt komplette Daten neu
        toast.success(/* Event-spezifische Nachricht */);
      }
    },
    reconnectIntervalMs: 5000,
  });

  return { data, loading, connected, refreshData };
}
```

### Server-side Broadcasts

Actions senden automatisch WebSocket-Broadcasts:

```tsx
// web/src/features/groups/actions/groupActions.ts
export async function createGroupAction(data: CreateGroupData) {
  try {
    const result = await createGroup(data);
    if (result.success && result.data) {
      // WebSocket-Broadcast an alle verbundenen Clients
      await broadcast('group-created', { 
        groupId: result.data.id, 
        name: result.data.name 
      });
    }
    return result;
  } catch (error) {
    // Error handling...
  }
}
```

## Performance Considerations

### Optimierte Datensynchronisation

1. **Fallback für komplexe Updates**: Bei Events wie `user-assigned` werden die kompletten Daten neu geladen, anstatt granulare State-Updates zu versuchen

2. **Toast-Debouncing**: Mehrere schnelle Updates führen nicht zu Toast-Spam

3. **Automatic Reconnect**: Bei Verbindungsabbruch automatische Wiederverbindung alle 5 Sekunden

4. **Connection Status UI**: Benutzer sehen den Verbindungsstatus und können bei Bedarf manuell neuladen

## Migration von anderen Patterns

### Von Legacy zu WebSocket

```tsx
// Alt (Legacy)
import { GroupsOverview } from './GroupsOverview';

// Neu (WebSocket)
import { GroupsOverviewWebSocket } from './GroupsOverviewWebSocket';
```

### Von SSR zu WebSocket

```tsx
// Alt (SSR)
import { GroupsOverviewUpdated } from './GroupsOverviewUpdated';

// Neu (WebSocket)
import { GroupsOverviewWebSocket } from './GroupsOverviewWebSocket';
```

## Best Practices

1. **AdminDashboard**: Immer WebSocket-Version verwenden für Live-Updates
2. **Public Pages**: SSR-Version für bessere Performance  
3. **Mobile/Offline**: Polling-Version als Fallback
4. **Error Handling**: WebSocket-Ausfälle graceful behandeln

## WebSocket Server

Der WebSocket-Server läuft automatisch mit der Next.js-Anwendung:

```bash
# Startet automatisch WebSocket-Server auf ws://localhost:3000/ws
npm run dev
```

Broadcasts werden entweder direkt über WebSocket oder als HTTP-Fallback an `/internal/broadcast` gesendet.

## Troubleshooting

### WebSocket-Verbindung getrennt
- Prüfe Browser Developer Tools → Network → WS
- Server-Logs prüfen: `[WebSocket] Broadcast...`
- Manueller Reload über "Neu laden" Button

### Events kommen nicht an
- Prüfe Action-Logs: `[GroupActions] Fehler bei...`
- Prüfe Broadcast-Logs: `[WebSocket] Broadcast "group-created"...`
- Teste mit `/internal/broadcast` HTTP-Endpoint

### Performance-Probleme
- WebSocket-Client-Anzahl prüfen
- Broadcast-Frequency analysieren
- Ggf. auf Polling-Version umstellen 