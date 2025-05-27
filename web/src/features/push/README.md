# Push-Notification-System

Ein einfaches und zuverlässiges Push-Notification-System für die Huegelfest PWA.

## Architektur

### Komponenten

1. **`usePushSubscription` Hook** - Zentraler Hook für Push-Subscription-Management
2. **`PushNotificationSettings`** - UI-Komponente für Push-Einstellungen
3. **`AutoPushPrompt`** - Dialog für Push-Permission-Anfragen
4. **Push Actions** - Server-Actions für API-Kommunikation

### Einfacher Ansatz

Das System folgt einem direkten, unkomplizierten Ansatz:

- **Keine komplexe Caching-Logik** - Direkte Browser-API und Server-Abfragen
- **Keine automatischen Popups** - Nur manuelle Triggers oder bei Device-Transfer
- **Klare Zustandsverwaltung** - Ein Hook, ein State, eine Quelle der Wahrheit
- **Standard React-Patterns** - Keine custom Event-Systeme oder komplexe Refs

## Verwendung

### usePushSubscription Hook

```typescript
import { usePushSubscription } from '@/features/push/hooks/usePushSubscription';

function MyComponent() {
  const {
    isSubscribed,
    isLoading,
    isSupported,
    error,
    subscribe,
    unsubscribe,
    refreshStatus
  } = usePushSubscription();

  return (
    <button 
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading || !isSupported}
    >
      {isSubscribed ? 'Deaktivieren' : 'Aktivieren'}
    </button>
  );
}
```

### Manueller Push-Prompt

```typescript
// Event dispatchen um Push-Prompt anzuzeigen
window.dispatchEvent(new CustomEvent('triggerPushPrompt', {
  detail: { reason: 'device-transfer' }
}));
```

### PushNotificationSettings Komponente

```typescript
import PushNotificationSettings from '@/features/settings/components/PushNotificationSettings';

function Settings() {
  return (
    <div>
      <PushNotificationSettings variant="row" />
    </div>
  );
}
```

## Funktionsweise

### 1. Status-Prüfung

Der Hook prüft den Push-Status in drei Schritten:

1. **Browser-Permission** - `Notification.permission`
2. **Browser-Subscription** - `pushManager.getSubscription()`
3. **Server-Status** - API-Call zu `/api/push/check`

### 2. Subscribe-Prozess

1. Permission anfordern: `Notification.requestPermission()`
2. Service Worker registrieren
3. Push-Subscription erstellen
4. Subscription an Server senden

### 3. Unsubscribe-Prozess

1. Browser-Subscription entfernen
2. Server über Unsubscribe informieren

## Konfiguration

### Umgebungsvariablen

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### Service Worker

Der Service Worker muss Push-Events verarbeiten:

```javascript
self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-96x96.png'
    })
  );
});
```

## Best Practices

### 1. Einfachheit vor Komplexität
- Direkte API-Calls statt komplexer Caching-Systeme
- Standard React-Patterns verwenden
- Keine vorzeitige Optimierung

### 2. Benutzerfreundlichkeit
- Keine automatischen Popups
- Klare Fehlermeldungen
- Respektvoller Umgang mit User-Permissions

### 3. Fehlerbehandlung
- Graceful Degradation bei fehlendem Browser-Support
- Cleanup bei inkonsistenten States
- Aussagekräftige Error-Messages

### 4. Performance
- Lazy Loading von Push-Komponenten
- Minimale Re-Renders durch optimierte Dependencies
- Effiziente State-Updates

## Debugging

### Development-Mode

Im Development-Mode ist ein Debug-Panel verfügbar:

```typescript
// Zeigt Debug-Informationen an
{
  isSupported: boolean,
  isSubscribed: boolean,
  isLoading: boolean,
  error: string | null,
  deviceId: string,
  permission: NotificationPermission
}
```

### Häufige Probleme

1. **"Permission denied"** - User hat Notifications abgelehnt
   - Lösung: Browser-Einstellungen zurücksetzen oder andere Domain verwenden

2. **"Service Worker not ready"** - Service Worker noch nicht registriert
   - Lösung: Warten auf `navigator.serviceWorker.ready`

3. **"VAPID key missing"** - Umgebungsvariable nicht gesetzt
   - Lösung: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in `.env.local` setzen

## Migration von komplexer Version

Falls du von einer komplexeren Version migrierst:

1. **Cache-Daten löschen**:
   ```javascript
   localStorage.removeItem('push-subscription-cache');
   localStorage.removeItem('push-permission-state');
   localStorage.removeItem('push-last-check');
   ```

2. **Event-Listener entfernen** - Keine custom Events mehr nötig

3. **Komponenten aktualisieren** - Neue Hook-API verwenden

## Fazit

Diese vereinfachte Version bietet:

- ✅ Zuverlässige Push-Notifications
- ✅ Einfache Wartung und Debugging
- ✅ Gute Performance ohne Over-Engineering
- ✅ Klare, verständliche Codebase
- ✅ Standard React/Next.js Patterns 