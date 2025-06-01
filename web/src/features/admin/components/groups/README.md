# Groups Feature - WebSocket Real-time Implementation

## Übersicht

Das Groups-Feature nutzt **WebSocket-basierte Echtzeit-Synchronisation** für Live-Updates zwischen mehreren Admin-Sessions.

## Architektur

### Actions (Server Actions)
- `fetchGroupsData.ts` - Aggregiert alle Daten für das Groups-Management
- `groupActions.ts` - Individuelle Server Actions für CRUD-Operationen mit WebSocket-Broadcasts

### Komponenten

#### WebSocket Real-time Component
- `GroupsOverviewWebSocketClient.tsx` - Hauptkomponente mit WebSocket-Integration

#### Sub-Components  
- `GroupsTab.tsx` - Gruppenverwaltung
- `UsersTab.tsx` - Benutzerverwaltung mit Gruppenzuweisungen
- `RegistrationsTab.tsx` - Anmeldungen und Zahlungsstatus

### Services
Die Services werden von den Actions verwendet für Datenbankoperationen.

### Hooks
- `useGroupsWebSocket.ts` - WebSocket-Hook für Echtzeit-Daten

## Verwendung

### Standard-Implementierung:
```tsx
import { GroupsOverviewWebSocketClient } from '@/features/admin/components/groups/components';

// Im AdminDashboard
<GroupsOverviewWebSocketClient initialData={initialGroupsData} />
```

## Vorteile der WebSocket-Architektur

1. **Echtzeit-Synchronisation**: Live-Updates zwischen Admin-Sessions
2. **Automatische Reconnects**: Verbindungsabbrüche werden automatisch behandelt
3. **Toast-Benachrichtigungen**: Feedback für ausführende Aktionen
4. **Connection-Status**: Sichtbare Verbindungsanzeige
5. **Typsicherheit**: Explizite TypeScript-Typen für alle Datenstrukturen

## Datenfluss

1. Admin führt Aktion aus → Server Action
2. Server Action führt DB-Operation durch
3. WebSocket-Broadcast an alle verbundenen Clients
4. Alle Admin-Sessions erhalten Live-Updates

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

### WebSocket Real-time (Aktuelle Implementierung)
- **Hook**: `useGroupsWebSocket()`
- **Component**: `GroupsOverviewWebSocketClient`
- **Features**: Live-Updates, Connection-Status, Toast-Benachrichtigungen
- **Verwendet**: Bestehende WebSocket-Infrastruktur (`useWebSocket`)

```tsx
import { useGroupsWebSocket } from '../hooks/useGroupsWebSocket';

const { data, loading, connected, refreshData } = useGroupsWebSocket();
```

## WebSocket Integration Details

### Hook Implementation

```